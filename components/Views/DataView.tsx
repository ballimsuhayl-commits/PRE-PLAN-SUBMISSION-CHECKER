export default function DataView() {
  const run = async () => {
    const res = await fetch("/api/process_address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: "27 Gainsborough Drive, Durban" })
    });
    const json = await res.json();
    alert(JSON.stringify(json, null, 2));
  };

  return (
    <div style={{ padding: 20 }}>
      <button onClick={run}>TEST BACKEND</button>
    </div>
  );
}
