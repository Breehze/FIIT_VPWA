const apiUrl = import.meta.env.QCLI_API_URL;

if (!apiUrl) {
  throw new Error('QCLI_API_URL is not configured');
}

export const API_URL = apiUrl.replace(/\/+$/, '');
