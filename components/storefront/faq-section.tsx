import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/storefront/reveal";
import { SectionHeading } from "@/components/storefront/section-heading";
import { SITE } from "@/lib/utils/site";
import type { Faq } from "@/types";

export function FaqSection({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) return null;

  return (
    <section className="section" aria-labelledby="faq-title">
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow="Questions" title="Answered plainly" />

            <div className="glass-pane mt-10 p-6">
              <p className="text-sm leading-relaxed text-ink-secondary">
                If your question is not here, our client care team handles the pieces themselves and
                will tell you what they actually think.
              </p>
              <a
                href={`mailto:${SITE.email}`}
                className="mt-4 inline-block text-sm text-accent underline decoration-accent-quiet underline-offset-4 transition-colors hover:text-accent-strong"
              >
                {SITE.email}
              </a>
              <p className="mt-2 text-xs text-ink-muted">{SITE.hours}</p>
            </div>
          </div>

          <Reveal className="lg:col-span-7">
            <Accordion type="single" collapsible className="w-full border-t border-hairline">
              {faqs.map((faq, i) => (
                <AccordionItem key={faq.question} value={`faq-${i}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
