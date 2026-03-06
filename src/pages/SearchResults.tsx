import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useFoodItems } from "@/hooks/useFoodItems";
import { useAccommodations } from "@/hooks/useAccommodations";
import { useExplorePlaces } from "@/hooks/useExplorePlaces";
import { useStudySpots } from "@/hooks/useStudySpots";
import { useEssentials } from "@/hooks/useEssentials";

type ResultCardProps = {
  title: string;
  subtitle: string;
  meta: string;
  image: string;
  link: string;
};

const ResultCard = ({ title, subtitle, meta, image, link }: ResultCardProps) => {
  return (
    <Link
      to={link}
      className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-border hover:border-primary/30"
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{meta}</p>
        <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </Link>
  );
};

const SearchResults = () => {
  const [params, setParams] = useSearchParams();
  const paramQuery = params.get("q") ?? "";
  const [query, setQuery] = useState(paramQuery);

  const { items: foodItems } = useFoodItems();
  const { items: accommodations } = useAccommodations();
  const { items: explorePlaces } = useExplorePlaces();
  const { items: studySpots } = useStudySpots();
  const { items: essentials } = useEssentials();

  useEffect(() => {
    setQuery(paramQuery);
  }, [paramQuery]);

  const normalizedQuery = useMemo(() => paramQuery.trim().toLowerCase(), [paramQuery]);
  const hasQuery = normalizedQuery.length > 0;

  const matches = useCallback(
    (value: string | null | undefined) =>
      !!value && value.toLowerCase().includes(normalizedQuery),
    [normalizedQuery]
  );
  const matchesArray = useCallback(
    (value: string[] | null | undefined) =>
      !!value && value.some((v) => v.toLowerCase().includes(normalizedQuery)),
    [normalizedQuery]
  );

  const foodResults = useMemo(() => {
    if (!hasQuery) return [];
    return foodItems.filter(
      (item) =>
        matches(item.name) ||
        matches(item.restaurant) ||
        matches(item.comment)
    );
  }, [foodItems, hasQuery, matches]);

  const accommodationResults = useMemo(() => {
    if (!hasQuery) return [];
    return accommodations.filter(
      (item) =>
        matches(item.name) ||
        matches(item.type) ||
        matches(item.distance) ||
        matches(item.comment) ||
        matchesArray(item.amenities)
    );
  }, [accommodations, hasQuery, matches, matchesArray]);

  const exploreResults = useMemo(() => {
    if (!hasQuery) return [];
    return explorePlaces.filter(
      (item) =>
        matches(item.name) ||
        matches(item.type) ||
        matches(item.distance) ||
        matches(item.timing) ||
        matches(item.crowd) ||
        matches(item.comment)
    );
  }, [explorePlaces, hasQuery, matches]);

  const studyResults = useMemo(() => {
    if (!hasQuery) return [];
    return studySpots.filter(
      (item) =>
        matches(item.name) ||
        matches(item.type) ||
        matches(item.distance) ||
        matches(item.timing) ||
        matches(item.noise) ||
        matches(item.comment)
    );
  }, [studySpots, hasQuery, matches]);

  const essentialsResults = useMemo(() => {
    if (!hasQuery) return [];
    return essentials.filter(
      (item) =>
        matches(item.name) ||
        matches(item.category) ||
        matches(item.distance) ||
        matches(item.comment)
    );
  }, [essentials, hasQuery, matches]);

  const totalResults =
    foodResults.length +
    accommodationResults.length +
    exploreResults.length +
    studyResults.length +
    essentialsResults.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-10">
        <section className="container mx-auto px-4 md:px-6">
          <div className="bg-card/80 border border-border rounded-2xl p-4 md:p-6 shadow-sm">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Search Across All Modules
            </h1>
            <form
              className="flex flex-col sm:flex-row gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = query.trim();
                if (!trimmed) return;
                setParams({ q: trimmed });
              }}
            >
              <input
                type="text"
                placeholder="Search for food, hostels, places..."
                className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="submit"
                className="rounded-xl bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
              >
                Search
              </button>
            </form>
            {hasQuery && (
              <p className="mt-3 text-sm text-muted-foreground">
                {totalResults} result{totalResults === 1 ? "" : "s"} for "{paramQuery}"
              </p>
            )}
          </div>
        </section>

        <section className="container mx-auto px-4 md:px-6 mt-8 space-y-10">
          {!hasQuery && (
            <div className="text-muted-foreground">
              Enter a search term to find results across Food, Accommodation, Explore, Study, and Essentials.
            </div>
          )}

          {hasQuery && totalResults === 0 && (
            <div className="text-muted-foreground">
              No results found. Try a different keyword.
            </div>
          )}

          {foodResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Food & Eating</h2>
                <Link to="/food" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {foodResults.map((item) => (
                  <ResultCard
                    key={`food-${item.id}`}
                    title={item.name}
                    subtitle={item.restaurant}
                    meta="Food"
                    image={item.image}
                    link="/food"
                  />
                ))}
              </div>
            </div>
          )}

          {accommodationResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Accommodation</h2>
                <Link to="/accommodation" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {accommodationResults.map((item) => (
                  <ResultCard
                    key={`acc-${item.id}`}
                    title={item.name}
                    subtitle={`${item.type} • ${item.distance}`}
                    meta="Accommodation"
                    image={item.image}
                    link="/accommodation"
                  />
                ))}
              </div>
            </div>
          )}

          {exploreResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Explore Nearby</h2>
                <Link to="/explore" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {exploreResults.map((item) => (
                  <ResultCard
                    key={`explore-${item.id}`}
                    title={item.name}
                    subtitle={`${item.type} • ${item.distance}`}
                    meta="Explore"
                    image={item.image}
                    link="/explore"
                  />
                ))}
              </div>
            </div>
          )}

          {studyResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Study Zones</h2>
                <Link to="/study" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {studyResults.map((item) => (
                  <ResultCard
                    key={`study-${item.id}`}
                    title={item.name}
                    subtitle={`${item.type} • ${item.distance}`}
                    meta="Study"
                    image={item.image}
                    link="/study"
                  />
                ))}
              </div>
            </div>
          )}

          {essentialsResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Essentials</h2>
                <Link to="/essentials" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {essentialsResults.map((item) => (
                  <ResultCard
                    key={`ess-${item.id}`}
                    title={item.name}
                    subtitle={`${item.category} • ${item.distance}`}
                    meta="Essentials"
                    image={item.image}
                    link="/essentials"
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SearchResults;
