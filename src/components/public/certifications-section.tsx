import { Calendar, ExternalLink } from "lucide-react";
import Image from "next/image";

import { Reveal } from "@/components/public/reveal";
import { SectionHeading } from "@/components/public/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import type { PublicPortfolio } from "@/lib/public-data";
import { formatDate } from "@/lib/utils";

export function CertificationsSection({
  certifications,
}: {
  certifications: PublicPortfolio["certifications"];
}) {
  return (
    <section id="certifications" className="scroll-mt-24 border-t border-border bg-muted/20 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Certifications"
          title="Verified learning."
          description="Certifications appear here only after they have been completed and added with their credential details."
        />

        {certifications.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certifications.map((certification, index) => (
              <Reveal key={certification.id} delay={Math.min(index * 0.05, 0.2)}>
                <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 card-hover">
                  {certification.imageUrl ? (
                    <div className="relative mb-4 aspect-[16/9] overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={certification.imageUrl}
                        alt={`${certification.title} certificate`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <h3 className="text-sm font-semibold tracking-tight">{certification.title}</h3>
                  <p className="mt-1 text-xs text-accent">{certification.issuer}</p>
                  {certification.issueDate ? (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Calendar className="h-3 w-3" aria-hidden />
                      Issued {formatDate(certification.issueDate)}
                    </p>
                  ) : null}
                  {certification.credentialId ? (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Credential ID: {certification.credentialId}
                    </p>
                  ) : null}
                  <div className="mt-auto pt-4">
                    {certification.credentialUrl ? (
                      <a
                        href={certification.credentialUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-accent"
                      >
                        Verify credential
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/70">Verification link pending</span>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="BadgeCheck"
            title="No certifications published yet"
            description="Certifications are added only when they are completed and verifiable. Nothing is listed speculatively."
          />
        )}
      </div>
    </section>
  );
}
