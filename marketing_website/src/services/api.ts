export type AppointmentPayload = {
  name: string;
  phone: string;
  email: string;
  service: string;
  mode: string;
  date: string;
  time: string;
  notes: string;
  consent: boolean;
  website: string;
};
export type FranchisePayload = {
  name: string;
  phone: string;
  type: string;
  area: string;
  consent: boolean;
  website: string;
};

const BASE = import.meta.env.VITE_API_URL || '';

const CONFIG_ERROR =
  'Unable to reach our booking service. If this continues, contact the studio — the site may need to be updated.';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
  } catch {
    throw new Error('Unable to connect to our booking service. Please try again shortly.');
  }

  const text = await response.text();
  const trimmed = text.trimStart();
  if (trimmed.startsWith('<!') || trimmed.startsWith('<html')) {
    throw new Error(CONFIG_ERROR);
  }

  let payload: { error?: { message?: unknown } } | null = null;
  if (text) {
    try {
      payload = JSON.parse(text) as { error?: { message?: unknown } };
    } catch {
      throw new Error(CONFIG_ERROR);
    }
  }

  if (!response.ok) {
    const message = payload?.error?.message;
    throw new Error(
      typeof message === 'string'
        ? message
        : response.status === 409
          ? 'That appointment slot was just booked. Please choose another.'
          : 'Your request could not be completed. Please review your details and try again.',
    );
  }

  if (payload == null) {
    throw new Error(CONFIG_ERROR);
  }

  return payload as T;
}

export const api = {
  slots: (date: string, mode: string) => request<{ date: string; mode: string; slots: { time: string; available: boolean }[] }>(
    `/api/v1/public/slots?date=${encodeURIComponent(date)}&mode=${encodeURIComponent(mode)}`,
  ),
  book: (body: AppointmentPayload) => request<{ reference: string; status?: string; ok?: boolean }>(
    '/api/v1/public/appointments',
    { method: 'POST', body: JSON.stringify(body) },
  ),
  franchise: (body: FranchisePayload) => request<{ ok: boolean }>(
    '/api/v1/public/franchise',
    { method: 'POST', body: JSON.stringify(body) },
  ),
};