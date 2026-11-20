type SendOtpInput = {
  email: string;
  otp: string;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function sendOtpEmail({ email, otp }: SendOtpInput) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY belum diatur");
  }

  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    throw new Error("RESEND_FROM_EMAIL belum diatur");
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Kode verifikasi Santosa POS",
      text: `Kode verifikasi kamu: ${otp}\n\nBerlaku 5 menit. Jangan bagikan kode ini.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#16181d">
          <p style="font-size:12px;font-weight:700;letter-spacing:1px;color:#c81e28;margin:0 0 8px">SANTOSA POS</p>
          <h1 style="font-size:24px;line-height:32px;margin:0 0 12px">Kode verifikasi email</h1>
          <p style="font-size:14px;line-height:22px;color:#5d6370;margin:0 0 24px">
            Masukkan kode ini untuk memastikan emailmu benar.
          </p>
          <div style="border:1px solid #e3e5e9;border-radius:16px;padding:20px;text-align:center">
            <span style="font-size:34px;font-weight:800;letter-spacing:8px;color:#16181d">${otp}</span>
          </div>
          <p style="font-size:12px;line-height:20px;color:#7c8290;margin:20px 0 0">
            Kode berlaku 5 menit. Abaikan email ini jika kamu tidak mendaftar.
          </p>
        </div>
      `,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Resend gagal (${response.status}): ${body.slice(0, 200)}`,
    );
  }
}
