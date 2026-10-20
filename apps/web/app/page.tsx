import { CollaborationSection } from "@/components/collaboration-section";
import { CtaSection } from "@/components/cta-section";
import { CustomersSection } from "@/components/customers-section";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { IntegrationsSection } from "@/components/integrations-section";
import { UseCasesSection } from "@/components/use-cases-section";

export default function Home() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <Header />
      <Hero />
      <div className="text-foreground font-sans text-[17px] leading-relaxed sm:text-lg">
        <CustomersSection />
        <UseCasesSection />
        <CollaborationSection />
        <IntegrationsSection />
      </div>
      <CtaSection />
      <Footer />
    </div>
  );
}
