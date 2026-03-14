export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Newspaper, Briefcase } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function AdminDashboard() {
  const [activeMembers, totalEvents, totalPosts, activeJobs, recentMembers] =
    await Promise.all([
      prisma.member.count({ where: { status: "ACTIVE" } }),
      prisma.event.count(),
      prisma.post.count({ where: { published: true } }),
      prisma.jobPosting.count({ where: { active: true } }),
      prisma.member.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { name: true, createdAt: true },
      }),
    ]);

  const stats = [
    { label: "Miembros activos", value: String(activeMembers), icon: Users },
    { label: "Eventos", value: String(totalEvents), icon: Calendar },
    { label: "Noticias publicadas", value: String(totalPosts), icon: Newspaper },
    { label: "Empleos activos", value: String(activeJobs), icon: Briefcase },
  ];

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Miembros recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMembers.map((member) => (
                <div
                  key={member.name}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(member.createdAt, "d MMM yyyy", { locale: es })}
                  </span>
                </div>
              ))}
              {recentMembers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay miembros registrados
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
