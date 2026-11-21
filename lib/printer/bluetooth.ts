export type BluetoothCharacteristic = {
  properties: { write: boolean; writeWithoutResponse: boolean };
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithoutResponse?(value: BufferSource): Promise<void>;
};

type BluetoothService = {
  getCharacteristics(): Promise<BluetoothCharacteristic[]>;
};

type BluetoothServer = {
  connected: boolean;
  connect(): Promise<BluetoothServer>;
  disconnect(): void;
  getPrimaryServices(): Promise<BluetoothService[]>;
};

export type BluetoothPrinterDevice = {
  id: string;
  name?: string | null;
  gatt?: BluetoothServer;
  addEventListener(type: "gattserverdisconnected", listener: () => void): void;
  removeEventListener(
    type: "gattserverdisconnected",
    listener: () => void,
  ): void;
};

type BluetoothApi = {
  requestDevice(options: {
    acceptAllDevices?: boolean;
    optionalServices?: string[];
  }): Promise<BluetoothPrinterDevice>;
  getDevices?(): Promise<BluetoothPrinterDevice[]>;
};

export type PrinterConnection = {
  deviceId: string;
  deviceName: string;
  device: BluetoothPrinterDevice;
  characteristic: BluetoothCharacteristic;
};

/** GATT services exposed by common 58mm BLE ESC/POS printers. */
export const PRINTER_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "0000ffe5-0000-1000-8000-00805f9b34fb",
  "0000ffb0-0000-1000-8000-00805f9b34fb",
  "0000fff0-0000-1000-8000-00805f9b34fb",
  "0000ae30-0000-1000-8000-00805f9b34fb",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
];

const CHUNK_SIZE = 100;
const CHUNK_DELAY_MS = 18;

export function isBluetoothPrintingSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

function getBluetoothApi(): BluetoothApi {
  const api = (navigator as Navigator & { bluetooth?: BluetoothApi }).bluetooth;
  if (!api) {
    throw new Error(
      "Browser ini belum mendukung Web Bluetooth. Pakai Chrome di Android.",
    );
  }
  return api;
}

async function connectDevice(
  device: BluetoothPrinterDevice,
): Promise<PrinterConnection> {
  const server = await device.gatt?.connect();
  if (!server) throw new Error("Printer tidak mendukung koneksi GATT.");

  try {
    const services = await server.getPrimaryServices();
    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      for (const characteristic of characteristics) {
        if (
          characteristic.properties.writeWithoutResponse ||
          characteristic.properties.write
        ) {
          return {
            deviceId: device.id,
            deviceName: device.name || "Printer Bluetooth",
            device,
            characteristic,
          };
        }
      }
    }
  } catch (error) {
    server.disconnect();
    throw error;
  }

  server.disconnect();
  throw new Error(
    "Printer tidak punya karakteristik tulis. Pastikan printer BLE ESC/POS, bukan Bluetooth Classic.",
  );
}

export async function requestPrinterConnection(): Promise<PrinterConnection> {
  const device = await getBluetoothApi().requestDevice({
    acceptAllDevices: true,
    optionalServices: PRINTER_SERVICES,
  });
  return connectDevice(device);
}

export async function reconnectPrinterConnection(
  deviceId: string,
): Promise<PrinterConnection | null> {
  const api = getBluetoothApi();
  const devices = (await api.getDevices?.()) ?? [];
  const device = devices.find((item) => item.id === deviceId);
  if (!device) return null;
  return connectDevice(device);
}

export async function writePrinterBytes(
  connection: PrinterConnection,
  bytes: Uint8Array,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const { characteristic } = connection;
  const writeWithoutResponse = characteristic.writeValueWithoutResponse?.bind(
    characteristic,
  );
  const withoutResponse =
    characteristic.properties.writeWithoutResponse && Boolean(writeWithoutResponse);

  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    const end = Math.min(offset + CHUNK_SIZE, bytes.length);
    const chunk = new Uint8Array(end - offset);
    chunk.set(bytes.subarray(offset, end));
    if (withoutResponse && writeWithoutResponse) {
      await writeWithoutResponse(chunk);
    } else {
      await characteristic.writeValue(chunk);
    }
    onProgress?.(Math.min(1, end / bytes.length));
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, CHUNK_DELAY_MS);
    await promise;
  }
}

export function describeBluetoothError(error: unknown): string {
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    if (error.name === "NotFoundError") return "Tidak ada printer yang dipilih.";
    if (error.name === "SecurityError") return "Izin Bluetooth ditolak.";
    if (error.name === "NetworkError") {
      return "Koneksi printer gagal. Nyalakan printer lalu coba lagi.";
    }
    if (error.name === "NotSupportedError") {
      return "Printer tidak mendukung Web Bluetooth (harus BLE).";
    }
  }
  return error instanceof Error ? error.message : "Gagal menghubungkan printer.";
}
