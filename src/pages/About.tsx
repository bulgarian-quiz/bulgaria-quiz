import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail } from "lucide-react";
import aboutMountains from "@/assets/about-mountains.jpg";
import { useSeo } from "@/seo/useSeo";

const About: React.FC = () => {
  useSeo('/about');
  const { t } = useLanguage();

  const teamMembers = [
    {
      name: t.teamMember1Name,
      class: "6A",
      school: t.schoolName,
      email: "m.mutafchiev2025@pmg-pernik.com",
    },
    {
      name: t.teamMember2Name,
      class: "6A",
      school: t.schoolName,
      email: "t.petrov2025@pmg-pernik.com",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />


      <main className="pt-24 pb-12 px-4 flex-1 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="collection-heading text-foreground">{t.aboutUs}</h1>

          {/* Mountain image, printed as an atlas plate */}
          <div className="atlas-plate mb-8 animate-scale-in">
            <img
              src={aboutMountains}
              alt=""
              className="w-full h-64 sm:h-80 object-cover"
            />
          </div>

          {/* Intro Text */}
          <p
            className="text-lg text-muted-foreground text-center mb-16 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            {t.aboutIntro}
          </p>

          {/* Team Members */}
          <div className="space-y-6">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="group glass-card rounded-3xl p-6 liquid-glow animate-slide-up"
                style={{ animationDelay: `${0.3 + index * 0.15}s` }}
              >
                <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {member.name}
                </h3>
                <p className="text-lg text-muted-foreground mb-4">
                  {member.class} {t.class}, {member.school}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
                  <div className="p-2 rounded-xl glass-button-primary">
                    <Mail className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span>{t.contactEmail}: </span>
                  <a
                    href={`mailto:${member.email}`}
                      className="text-primary hover:underline transition-interactive hover:text-primary/80 break-all"
                  >
                    {member.email}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
