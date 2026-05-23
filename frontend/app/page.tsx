type HealthResponse = { status: string };

export default async function Home() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
  const { status } = (await res.json()) as HealthResponse;

  return (
    <main>
      <h1>Hello APEX</h1>
      <p>Backend status: {status}</p>
    </main>
  );
}