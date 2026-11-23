export function createCallable(auth) {
  return (name) => async (data = {}) => {
    const user = auth.currentUser;
    if (!user) { const error = new Error("Sign in is required."); error.code = "unauthenticated"; throw error; }
    const token = await user.getIdToken();
    const response = await fetch("/api/callable", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify({ name, data }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(payload.error?.message || "The server could not complete this request."); error.code = payload.error?.code || "internal"; throw error; }
    return { data: payload.data };
  };
}
