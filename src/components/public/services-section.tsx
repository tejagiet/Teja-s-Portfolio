import { Check } from "lucide-react";

import { Reveal } from "@/components/public/reveal";
import { SectionHeading } from "@/components/public/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import type { PublicPortfolio } from "@/lib/public-data";

export function ServicesSection({ services }: { services: PublicPortfolio["services"] }) {
  return (
    <section id="services" className="scroll-mt-24 border-t border-border py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="What I work on"
          title="Building across the stack."
          description="The areas I focus on — from application interfaces and APIs to data, infrastructure and intelligent features."
        />

        {services.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <Reveal key={service.id} delay={Math.min(index * 0.05, 0.25)}>
                <div className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 card-hover">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent transition-transform group-hover:-translate-y-0.5">
                    <Icon name={service.icon} className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold tracking-tight">{service.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{service.description}</p>
                  {service.features.length ? (
                    <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Check className="h-2.5 w-2.5 shrink-0 text-accent" aria-hidden />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {service.priceNote ? (
                    <p className="mt-4 border-t border-border pt-3 text-[10px] text-muted-foreground">
                      {service.priceNote}
                    </p>
                  ) : null}
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="Layers"
            title="Services are being configured"
            description="Areas of work will appear here once they are published from the admin dashboard."
          />
        )}
      </div>
    </section>
  );
}
