"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  describeBluetoothError,
  isBluetoothPrintingSupported,
  type PrinterConnection,
  reconnectPrinterConnection,
  requestPrinterConnection,
  writePrinterBytes,
} from "@/lib/printer/bluetooth";

export type PrinterStatus =
  | "unsupported"
  | "idle"
  | "connecting"
  | "connected"
  | "printing"
  | "error";

type ReceiptPrinterContextValue = {
  supported: boolean;
  status: PrinterStatus;
  deviceName: string | null;
  error: string | null;
  autoPrint: boolean;
  setAutoPrint: (value: boolean) => void;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  print: (bytes: Uint8Array) => Promise<boolean>;
};

const STORAGE_DEVICE = "receiptPrinter.deviceId";
const STORAGE_AUTO = "receiptPrinter.autoPrint";

const ReceiptPrinterContext =
  createContext<ReceiptPrinterContextValue | null>(null);

export function ReceiptPrinterProvider({ children }: { children: ReactNode }) {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<PrinterStatus>("idle");
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoPrint, setAutoPrintState] = useState(true);

  const connectionRef = useRef<PrinterConnection | null>(null);
  const disconnectRef = useRef<(() => void) | null>(null);
  const queueRef = useRef<Promise<boolean>>(Promise.resolve(true));

  const attachConnection = useCallback((connection: PrinterConnection) => {
    connectionRef.current = connection;
    setDeviceName(connection.deviceName);
    setStatus("connected");
    setError(null);

    disconnectRef.current?.();
    const handleDisconnect = () => {
      connectionRef.current = null;
      setStatus("idle");
      setDeviceName(null);
    };
    connection.device.addEventListener("gattserverdisconnected", handleDisconnect);
    disconnectRef.current = () =>
      connection.device.removeEventListener(
        "gattserverdisconnected",
        handleDisconnect,
      );
  }, []);

  const disconnect = useCallback(() => {
    disconnectRef.current?.();
    disconnectRef.current = null;
    const current = connectionRef.current;
    connectionRef.current = null;
    current?.device.gatt?.disconnect();
    setDeviceName(null);
    setStatus(supported ? "idle" : "unsupported");
    try {
      window.localStorage.removeItem(STORAGE_DEVICE);
    } catch {
      // localStorage bisa diblokir; abaikan.
    }
  }, [supported]);

  const connect = useCallback(async () => {
    if (!isBluetoothPrintingSupported()) {
      setSupported(false);
      setStatus("unsupported");
      setError("Browser ini belum mendukung Web Bluetooth.");
      return false;
    }

    setStatus("connecting");
    setError(null);
    try {
      const connection = await requestPrinterConnection();
      attachConnection(connection);
      try {
        window.localStorage.setItem(STORAGE_DEVICE, connection.deviceId);
      } catch {
        // abaikan
      }
      return true;
    } catch (caught) {
      setStatus("idle");
      setError(describeBluetoothError(caught));
      return false;
    }
  }, [attachConnection]);

  const print = useCallback((bytes: Uint8Array) => {
    const run = async () => {
      let connection = connectionRef.current;

      if (!connection) {
        try {
          const savedId = window.localStorage.getItem(STORAGE_DEVICE);
          if (!savedId) {
            setError("Printer belum terhubung.");
            return false;
          }
          connection = await reconnectPrinterConnection(savedId);
          if (!connection) {
            setError("Printer tidak ditemukan. Hubungkan ulang.");
            return false;
          }
          attachConnection(connection);
        } catch (caught) {
          setError(describeBluetoothError(caught));
          setStatus("error");
          return false;
        }
      }

      setStatus("printing");
      setError(null);
      try {
        await writePrinterBytes(connection, bytes);
        setStatus("connected");
        return true;
      } catch (caught) {
        connectionRef.current = null;
        setStatus("error");
        setDeviceName(null);
        setError(describeBluetoothError(caught));
        return false;
      }
    };

    const next = queueRef.current.then(run, run);
    queueRef.current = next.catch(() => false);
    return next;
  }, [attachConnection]);

  const setAutoPrint = useCallback((value: boolean) => {
    setAutoPrintState(value);
    try {
      window.localStorage.setItem(STORAGE_AUTO, value ? "1" : "0");
    } catch {
      // abaikan
    }
  }, []);

  useEffect(() => {
    const ok = isBluetoothPrintingSupported();
    setSupported(ok);
    setStatus((current) => (ok ? current : "unsupported"));

    try {
      const savedAuto = window.localStorage.getItem(STORAGE_AUTO);
      if (savedAuto !== null) setAutoPrintState(savedAuto === "1");
    } catch {
      // abaikan
    }

    if (!ok) return;

    let cancelled = false;
    const restore = async () => {
      try {
        const savedId = window.localStorage.getItem(STORAGE_DEVICE);
        if (!savedId) return;
        const connection = await reconnectPrinterConnection(savedId);
        if (!cancelled && connection) attachConnection(connection);
      } catch {
        // Reconnect senyap gagal; user bisa hubungkan manual.
      }
    };
    void restore();

    return () => {
      cancelled = true;
    };
  }, [attachConnection]);

  useEffect(() => {
    return () => {
      disconnectRef.current?.();
      connectionRef.current?.device.gatt?.disconnect();
    };
  }, []);

  const value = useMemo<ReceiptPrinterContextValue>(
    () => ({
      supported,
      status,
      deviceName,
      error,
      autoPrint,
      setAutoPrint,
      connect,
      disconnect,
      print,
    }),
    [
      supported,
      status,
      deviceName,
      error,
      autoPrint,
      setAutoPrint,
      connect,
      disconnect,
      print,
    ],
  );

  return (
    <ReceiptPrinterContext.Provider value={value}>
      {children}
    </ReceiptPrinterContext.Provider>
  );
}

export function useReceiptPrinter(): ReceiptPrinterContextValue {
  const context = useContext(ReceiptPrinterContext);
  if (!context) {
    throw new Error(
      "useReceiptPrinter harus dipakai di dalam ReceiptPrinterProvider.",
    );
  }
  return context;
}
