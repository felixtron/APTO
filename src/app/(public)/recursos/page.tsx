import { FileText, Video, ExternalLink, Download, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const typeIcons: Record<string, React.ElementType> = {
  PDF: FileText,
  VIDEO: Video,
  LINK: ExternalLink,
  DOCUMENT: FileText,
};

const typeColors: Record<string, string> = {
  PDF: "bg-red-50 text-red-700",
  VIDEO: "bg-purple-50 text-purple-700",
  LINK: "bg-blue-50 text-blue-700",
  DOCUMENT: "bg-amber-50 text-amber-700",
};

export default async function RecursosPage() {
  const resources = await prisma.resource.findMany({
    where: { active: true },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Recursos
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Material profesional, guías y herramientas para terapeutas
            ocupacionales
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {resources.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No hay recursos disponibles aún.
            </p>
          ) : (
            <div className="space-y-4">
              {resources.map((resource) => {
                const Icon = typeIcons[resource.type] || FileText;
                const url = resource.fileUrl || resource.externalUrl;
                const isLink = resource.type === "LINK";

                return (
                  <div
                    key={resource.id}
                    className="flex items-start gap-4 rounded-xl border p-6 transition-shadow hover:shadow-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold">{resource.title}</h2>
                        {resource.membersOnly && (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="mr-1 h-3 w-3" />
                            Solo miembros
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {resource.description}
                      </p>
                      <div className="mt-3">
                        <Badge
                          variant="secondary"
                          className={typeColors[resource.type]}
                        >
                          {resource.type}
                        </Badge>
                      </div>
                    </div>
                    {resource.membersOnly ? (
                      <a
                        href="/auth/login"
                        className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
                      >
                        Iniciar sesión
                      </a>
                    ) : url ? (
                      <a
                        href={url}
                        target={isLink ? "_blank" : undefined}
                        rel={isLink ? "noopener noreferrer" : undefined}
                        className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
                      >
                        {isLink ? (
                          <>
                            Abrir <ExternalLink className="ml-1 h-3.5 w-3.5" />
                          </>
                        ) : (
                          <>
                            Descargar <Download className="ml-1 h-3.5 w-3.5" />
                          </>
                        )}
                      </a>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
