// import { Suspense } from "react";
// import { HomeHero } from "./_components/home-hero";
// import {
//   DepartmentsPreviewFallback,
//   DepartmentsPreviewSection,
//   FeaturedSermonsFallback,
//   FeaturedSermonsSection,
//   VisitSection,
//   WelcomeSection,
// } from "./_components/home-sections";
// import { SiteFooter, SiteHeader } from "./_components/site-chrome";

// export default function Home() {
//   return (
//     <>
//       <SiteHeader />

//       <main>
//         <HomeHero />
//         <WelcomeSection />
//         <Suspense fallback={<FeaturedSermonsFallback />}>
//           <FeaturedSermonsSection />
//         </Suspense>
//         <Suspense fallback={<DepartmentsPreviewFallback />}>
//           <DepartmentsPreviewSection />
//         </Suspense>
//         <VisitSection />
//       </main>

//       <SiteFooter />
//     </>
//   );
// }

import { Suspense } from "react";
import { HomeHero } from "./_components/home-hero";
import {
  DepartmentsPreviewFallback,
  DepartmentsPreviewSection,
  FeaturedSermonsFallback,
  FeaturedSermonsSection,
  ServicesSection,
  VisitSection,
  WelcomeSection,
} from "./_components/home-sections";
import { SiteFooter, SiteHeader } from "./_components/site-chrome";

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main>
        <HomeHero />
        <WelcomeSection />
        <ServicesSection />

        <Suspense fallback={<FeaturedSermonsFallback />}>
          <FeaturedSermonsSection />
        </Suspense>

        <Suspense fallback={<DepartmentsPreviewFallback />}>
          <DepartmentsPreviewSection />
        </Suspense>

        <VisitSection />
      </main>

      <SiteFooter />
    </>
  );
}
