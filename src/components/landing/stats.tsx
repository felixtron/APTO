const stats = [
  { value: "30+", label: "Años de trayectoria" },
  { value: "14", label: "Países CLATO" },
  { value: "9", label: "Universidades avaladas" },
  { value: "200+", label: "Miembros activos" },
];

export function Stats() {
  return (
    <section className="border-y bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-brand-500 sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
