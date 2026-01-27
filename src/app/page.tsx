import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Zap, ArrowRight, CheckCircle } from "lucide-react";
import { Header } from "@/components/layout/header";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container py-20 md:py-32">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Zap className="h-4 w-4" />
                Prosty sposób na znalezienie wspólnego czasu
              </div>

              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Znajdź <span className="text-primary">wspólny czas</span> ze
                znajomymi
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Utwórz wydarzenie, udostępnij link i pozwól wszystkim zaznaczyć
                kiedy są dostępni. Koniec z pytaniem każdego osobno!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" asChild>
                  <Link href="/sign-up">
                    Zacznij za darmo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/sign-in">Zaloguj się</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Decorative gradient */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,var(--tw-gradient-from)_0,transparent_100%)] from-primary/20" />
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Jak to działa?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Trzy proste kroki do znalezienia idealnego terminu spotkania
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background rounded-xl p-6 shadow-sm border">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  1. Utwórz wydarzenie
                </h3>
                <p className="text-muted-foreground">
                  Wybierz zakres dat i godzin, w których chcesz zorganizować
                  spotkanie.
                </p>
              </div>

              <div className="bg-background rounded-xl p-6 shadow-sm border">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  2. Udostępnij link
                </h3>
                <p className="text-muted-foreground">
                  Wyślij link znajomym. Nie muszą się rejestrować - wystarczy że
                  podadzą imię.
                </p>
              </div>

              <div className="bg-background rounded-xl p-6 shadow-sm border">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  3. Znajdź wspólny czas
                </h3>
                <p className="text-muted-foreground">
                  Zobacz na heatmapie kiedy wszyscy są dostępni i wybierz
                  najlepszy termin.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">
                  Dlaczego WhenWeFree?
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Proste i intuicyjne</h4>
                      <p className="text-muted-foreground">
                        Zaznaczaj dostępność przeciągając palcem lub myszką -
                        bez zbędnych kliknięć.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Działa na telefonie</h4>
                      <p className="text-muted-foreground">
                        Responsywny design zapewnia wygodę na każdym urządzeniu.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Bez rejestracji dla uczestników</h4>
                      <p className="text-muted-foreground">
                        Uczestnicy nie muszą zakładać konta - wystarczy link i
                        imię.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Automatyczny zapis</h4>
                      <p className="text-muted-foreground">
                        Zmiany zapisują się automatycznie - nie musisz klikać
                        "Zapisz".
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-2xl p-8 border">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-3 h-3 rounded-full bg-slot-empty border" />
                    <span>Nikt nie jest dostępny</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-3 h-3 rounded-full bg-slot-partial-50" />
                    <span>Niektórzy są dostępni</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-3 h-3 rounded-full bg-slot-full" />
                    <span>Wszyscy są dostępni</span>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Heatmapa pokazuje nakładające się dostępności wszystkich
                      uczestników - im ciemniejszy kolor, tym więcej osób może
                      się spotkać.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Gotowy na łatwe planowanie?
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Dołącz do tysięcy osób, które używają WhenWeFree do organizowania
              spotkań, imprez i wyjść ze znajomymi.
            </p>
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="mt-4"
            >
              <Link href="/sign-up">
                Utwórz darmowe konto
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} WhenWeFree. Wszystkie prawa zastrzeżone.</p>
        </div>
      </footer>
    </div>
  );
}
