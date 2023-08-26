export function Layout(props: { children: React.ReactNode }) {
  return (
    <>
      <main className="flex flex-col justify-center py-2">
        {props.children}
      </main>
    </>
  );
}
