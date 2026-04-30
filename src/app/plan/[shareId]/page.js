export default async function SharedPlanPage({ params }) {
  const { shareId } = await params;
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Shared Meal Plan</h1>
      <p>Plan ID: {shareId}</p>
      <p>Full implementation in D.2.</p>
    </div>
  );
}
