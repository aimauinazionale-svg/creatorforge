import fs from "node:fs";
import path from "node:path";

const messagesDir = path.join(process.cwd(), "messages");
const BRAND = "Sparkroll";

function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      deepMerge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

/** Shared landing sections (features → footer) per locale. */
const landingSections = {
  it: {
    features: {
      title: "Tutto ciò che ti serve per crescere",
      subtitle:
        "Un set mirato di strumenti per i workflow YouTube moderni—semplice, veloce e con costi sotto controllo.",
      items: {
        ideas: {
          title: "Generatore di idee con IA",
          description: "Genera idee e angolazioni in pochi secondi, poi affina con i prompt.",
        },
        seo: {
          title: "Titoli pronti per la SEO",
          description: "Crea titoli, tag e descrizioni migliori con una guida strutturata.",
        },
        competitors: {
          title: "Monitoraggio competitor",
          description: "Segui i canali che ammiri e impara da ciò che funziona.",
        },
        workflow: {
          title: "Workflow di produzione",
          description: "Script, note e stato in un unico posto—dalla bozza alla pubblicazione.",
        },
        calendar: {
          title: "Calendario di pubblicazione",
          description: "Pianifica upload, riprogramma con drag & drop e resta costante.",
        },
        thumbnails: {
          title: "Controllo miniature",
          description: "Analizza le miniature e ottieni miglioramenti concreti.",
        },
      },
    },
    how: {
      title: "Come funziona",
      subtitle: "Un ciclo semplice da ripetere ogni settimana.",
      steps: {
        connect: {
          label: "Passo 1",
          title: "Collega il tuo canale",
          description: "Accedi e collega YouTube per sbloccare analisi e pianificazione.",
        },
        build: {
          label: "Passo 2",
          title: "Pianifica con IA e workflow",
          description: "Genera idee, organizza attività e monitora i competitor in un hub.",
        },
        publish: {
          label: "Passo 3",
          title: "Programma e migliora",
          description: "Pianifica upload e affina le miniature con feedback rapido.",
        },
      },
    },
    comparison: {
      title: "Sparkroll vs. alternative",
      subtitle: "Smetti di unire strumenti gratuiti e fogli di calcolo.",
      table: { feature: "Funzionalità", brand: "Sparkroll", alternatives: "Altri strumenti" },
      rows: {
        freeTools: "Toolkit core gratuito",
        aiCredits: "Assistenza IA integrata",
        workflow: "Workflow e note",
        competitors: "Monitoraggio competitor",
        calendar: "Calendario di pubblicazione",
        thumbnails: "Analisi miniature",
      },
    },
    testimonials: {
      title: "I creator amano la semplicità",
      subtitle: "Meno confusione, più risultati.",
      items: {
        "0": {
          quote: "Ho sostituito tre fogli di calcolo e due app in un pomeriggio.",
          name: "Ava",
          role: "Creator educativa",
        },
        "1": {
          quote: "La vista workflow mantiene i miei upload costanti—anche quando sono impegnato.",
          name: "Noah",
          role: "Creator gaming",
        },
        "2": {
          quote: "Il feedback sulle miniature è rapido e concreto. Il mio CTR è migliorato.",
          name: "Mia",
          role: "Creator vlog",
        },
      },
    },
    pricing: {
      title: "Prezzi semplici",
      subtitle: "Inizia gratis. Passa al piano superiore quando serve.",
      highlight: "Più popolare",
      finePrint: "Puoi iniziare con il piano Free e passare al superiore in qualsiasi momento.",
      plans: {
        free: {
          label: "Free",
          price: "$0",
          description: "L'essenziale per pianificare e pubblicare con costanza.",
          cta: "Inizia gratis",
          features: {
            "0": "Generazione idee IA (limitata)",
            "1": "Board workflow",
            "2": "Pianificazione base",
            "3": "Strumenti creator essenziali",
          },
        },
        pro: {
          label: "Pro",
          price: "$9/mese",
          description: "Più automazione e pianificazione avanzata.",
          cta: "Prova Pro",
          features: {
            "0": "Limiti IA più alti",
            "1": "Monitoraggio competitor",
            "2": "Viste calendario avanzate",
            "3": "Miglioramenti prioritari",
          },
        },
        creator: {
          label: "Creator",
          price: "$19/mese",
          description: "Per team e creator seri.",
          cta: "Passa a Creator",
          features: {
            "0": "Workflow per team",
            "1": "Più canali (in arrivo)",
            "2": "Analisi avanzate (in arrivo)",
            "3": "Supporto di prima classe",
          },
        },
      },
    },
    faq: {
      title: "Domande frequenti",
      subtitle: "Tutto quello che devi sapere prima di iniziare.",
      items: {
        "0": {
          q: "Sparkroll è davvero gratuito?",
          a: "Sì. Il piano Free include il toolkit core e un utilizzo IA limitato.",
        },
        "1": {
          q: "Devo collegare YouTube?",
          a: "Puoi esplorare la landing senza collegare. Collegare sblocca analisi e pianificazione.",
        },
        "2": {
          q: "Quali lingue sono supportate?",
          a: "Sparkroll supporta 9 lingue: inglese, italiano, spagnolo, tedesco, francese, portoghese, russo, giapponese e cinese.",
        },
        "3": {
          q: "Posso usare il mio workflow?",
          a: "Sì. Puoi adattare il workflow al tuo processo e aggiornare gli stati man mano.",
        },
        "4": {
          q: "È ottimizzato per mobile?",
          a: "Sì. Landing e schermate principali sono responsive e compatibili con la dark mode.",
        },
        "5": {
          q: "Come inizio?",
          a: 'Clicca "Inizia gratis" per aprire l\'app e pianificare il prossimo upload.',
        },
      },
    },
    finalCta: {
      title: "Pronto a pubblicare con costanza?",
      subtitle: "Inizia gratis e pubblica il prossimo video con meno attrito.",
      primaryCta: "Inizia gratis",
      secondaryCta: "Vedi i prezzi",
    },
    footer: {
      brand: "Sparkroll",
      tagline: "Un toolkit gratuito per i creator YouTube moderni.",
      sections: { product: "Prodotto", social: "Social" },
      links: {
        features: "Funzionalità",
        pricing: "Prezzi",
        blog: "Blog",
        login: "Accedi",
      },
      social: { github: "GitHub", x: "X", youtube: "YouTube" },
      legal: { terms: "Termini", privacy: "Privacy" },
      copyright: "© {year} Sparkroll. Tutti i diritti riservati.",
    },
  },
  es: {
    features: {
      title: "Todo lo que necesitas para crecer",
      subtitle:
        "Un conjunto enfocado de herramientas para flujos de YouTube modernos—simple, rápido y con costes controlados.",
      items: {
        ideas: {
          title: "Generador de ideas con IA",
          description: "Genera ideas y ángulos en segundos, luego itera con prompts.",
        },
        seo: {
          title: "Títulos listos para SEO",
          description: "Crea mejores títulos, etiquetas y descripciones con guía estructurada.",
        },
        competitors: {
          title: "Seguimiento de competidores",
          description: "Sigue canales que admiras y aprende de lo que funciona.",
        },
        workflow: {
          title: "Flujo de producción",
          description: "Guiones, notas y estado en un solo lugar—del borrador a la publicación.",
        },
        calendar: {
          title: "Calendario de publicación",
          description: "Planifica subidas, reprograma con drag & drop y mantén la constancia.",
        },
        thumbnails: {
          title: "Revisión de miniaturas",
          description: "Analiza miniaturas y obtén mejoras accionables.",
        },
      },
    },
    how: {
      title: "Cómo funciona",
      subtitle: "Un ciclo simple que puedes repetir cada semana.",
      steps: {
        connect: {
          label: "Paso 1",
          title: "Conecta tu canal",
          description: "Inicia sesión y vincula YouTube para desbloquear analíticas y programación.",
        },
        build: {
          label: "Paso 2",
          title: "Planifica con IA y flujo",
          description: "Genera ideas, organiza tareas y sigue competidores en un hub.",
        },
        publish: {
          label: "Paso 3",
          title: "Programa y mejora",
          description: "Programa subidas y refina miniaturas con feedback rápido.",
        },
      },
    },
    comparison: {
      title: "Sparkroll vs. alternativas",
      subtitle: "Deja de unir herramientas gratuitas y hojas de cálculo.",
      table: { feature: "Función", brand: "Sparkroll", alternatives: "Otras herramientas" },
      rows: {
        freeTools: "Kit core gratuito",
        aiCredits: "Asistencia IA integrada",
        workflow: "Flujo + notas",
        competitors: "Seguimiento de competidores",
        calendar: "Calendario de publicación",
        thumbnails: "Análisis de miniaturas",
      },
    },
    testimonials: {
      title: "A los creadores les encanta el enfoque",
      subtitle: "Menos desorden, más producción.",
      items: {
        "0": {
          quote: "Reemplacé tres hojas de cálculo y dos apps en una tarde.",
          name: "Ava",
          role: "Creadora educativa",
        },
        "1": {
          quote: "La vista de flujo mantiene mis subidas constantes—incluso cuando estoy ocupado.",
          name: "Noah",
          role: "Creador gaming",
        },
        "2": {
          quote: "El feedback de miniaturas es rápido y accionable. Mi CTR mejoró.",
          name: "Mia",
          role: "Creadora vlog",
        },
      },
    },
    pricing: {
      title: "Precios simples",
      subtitle: "Empieza gratis. Mejora cuando necesites más.",
      highlight: "Más popular",
      finePrint: "Puedes empezar en el plan Free y mejorar en cualquier momento.",
      plans: {
        free: {
          label: "Free",
          price: "$0",
          description: "Lo esencial para planificar y publicar con constancia.",
          cta: "Empezar gratis",
          features: {
            "0": "Generación de ideas IA (limitada)",
            "1": "Tablero de flujo",
            "2": "Programación básica",
            "3": "Herramientas creator esenciales",
          },
        },
        pro: {
          label: "Pro",
          price: "$9/mes",
          description: "Más automatización y planificación profunda.",
          cta: "Probar Pro",
          features: {
            "0": "Límites IA más altos",
            "1": "Seguimiento de competidores",
            "2": "Vistas de calendario avanzadas",
            "3": "Mejoras prioritarias",
          },
        },
        creator: {
          label: "Creator",
          price: "$19/mes",
          description: "Para equipos y creadores serios.",
          cta: "Ir a Creator",
          features: {
            "0": "Flujos listos para equipos",
            "1": "Más canales (próximamente)",
            "2": "Analíticas avanzadas (próximamente)",
            "3": "Soporte de primera clase",
          },
        },
      },
    },
    faq: {
      title: "Preguntas frecuentes",
      subtitle: "Todo lo que necesitas saber antes de empezar.",
      items: {
        "0": {
          q: "¿Sparkroll es realmente gratis?",
          a: "Sí. El plan Free incluye el kit core y uso limitado de IA.",
        },
        "1": {
          q: "¿Necesito conectar YouTube?",
          a: "Puedes explorar la landing sin conectar. Conectar desbloquea analíticas y programación.",
        },
        "2": {
          q: "¿Qué idiomas se admiten?",
          a: "Sparkroll admite 9 idiomas: inglés, italiano, español, alemán, francés, portugués, ruso, japonés y chino.",
        },
        "3": {
          q: "¿Puedo usar mi propio flujo?",
          a: "Sí. Puedes adaptar el flujo a tu proceso y actualizar estados según avances.",
        },
        "4": {
          q: "¿Está optimizado para móvil?",
          a: "Sí. La landing y las pantallas principales son responsive y compatibles con modo oscuro.",
        },
        "5": {
          q: "¿Cómo empiezo?",
          a: 'Haz clic en "Empezar gratis" para abrir la app y planificar tu próxima subida.',
        },
      },
    },
    finalCta: {
      title: "¿Listo para publicar con constancia?",
      subtitle: "Empieza gratis y publica tu próximo video con menos fricción.",
      primaryCta: "Empezar gratis",
      secondaryCta: "Ver precios",
    },
    footer: {
      brand: "Sparkroll",
      tagline: "Un kit gratuito para creadores de YouTube modernos.",
      sections: { product: "Producto", social: "Redes" },
      links: {
        features: "Funciones",
        pricing: "Precios",
        blog: "Blog",
        login: "Iniciar sesión",
      },
      social: { github: "GitHub", x: "X", youtube: "YouTube" },
      legal: { terms: "Términos", privacy: "Privacidad" },
      copyright: "© {year} Sparkroll. Todos los derechos reservados.",
    },
  },
  de: {
    features: {
      title: "Alles, was du zum Wachsen brauchst",
      subtitle:
        "Ein fokussiertes Toolset für moderne YouTube-Workflows—einfach, schnell und kostenbewusst.",
      items: {
        ideas: {
          title: "KI-Ideengenerator",
          description: "Generiere Videoideen und Blickwinkel in Sekunden, dann iteriere mit Prompts.",
        },
        seo: {
          title: "SEO-fertige Titel",
          description: "Erstelle bessere Titel, Tags und Beschreibungen mit strukturierter Anleitung.",
        },
        competitors: {
          title: "Wettbewerber-Tracking",
          description: "Folge Kanälen, die du bewunderst, und lerne von dem, was funktioniert.",
        },
        workflow: {
          title: "Produktions-Workflow",
          description: "Skripte, Notizen und Status an einem Ort—vom Entwurf bis zur Veröffentlichung.",
        },
        calendar: {
          title: "Veröffentlichungskalender",
          description: "Plane Uploads, verschiebe per Drag & Drop und bleib konstant.",
        },
        thumbnails: {
          title: "Thumbnail-Checks",
          description: "Analysiere Thumbnails schnell und erhalte umsetzbare Verbesserungen.",
        },
      },
    },
    how: {
      title: "So funktioniert's",
      subtitle: "Ein einfacher Kreislauf, den du jede Woche wiederholen kannst.",
      steps: {
        connect: {
          label: "Schritt 1",
          title: "Kanal verbinden",
          description: "Melde dich an und verbinde YouTube für Analysen und Planung.",
        },
        build: {
          label: "Schritt 2",
          title: "Mit KI + Workflow planen",
          description: "Generiere Ideen, organisiere Aufgaben und verfolge Wettbewerber in einem Hub.",
        },
        publish: {
          label: "Schritt 3",
          title: "Planen und verbessern",
          description: "Plane Uploads und verfeinere Thumbnails mit schnellem Feedback.",
        },
      },
    },
    comparison: {
      title: "Sparkroll vs. Alternativen",
      subtitle: "Schluss mit dem Zusammenflicken von Gratis-Tools und Tabellen.",
      table: { feature: "Funktion", brand: "Sparkroll", alternatives: "Andere Tools" },
      rows: {
        freeTools: "Kostenloses Core-Toolkit",
        aiCredits: "Integrierte KI-Unterstützung",
        workflow: "Workflow + Notizen",
        competitors: "Wettbewerber-Tracking",
        calendar: "Veröffentlichungskalender",
        thumbnails: "Thumbnail-Analyse",
      },
    },
    testimonials: {
      title: "Creator lieben den Fokus",
      subtitle: "Weniger Ballast, mehr Output.",
      items: {
        "0": {
          quote: "Ich habe drei Tabellen und zwei Apps an einem Nachmittag ersetzt.",
          name: "Ava",
          role: "Bildungs-Creator",
        },
        "1": {
          quote: "Die Workflow-Ansicht hält meine Uploads konstant—auch wenn ich beschäftigt bin.",
          name: "Noah",
          role: "Gaming-Creator",
        },
        "2": {
          quote: "Thumbnail-Feedback ist schnell und umsetzbar. Mein CTR hat sich verbessert.",
          name: "Mia",
          role: "Vlog-Creator",
        },
      },
    },
    pricing: {
      title: "Einfache Preise",
      subtitle: "Kostenlos starten. Upgraden, wenn du mehr brauchst.",
      highlight: "Am beliebtesten",
      finePrint: "Du kannst mit dem Free-Plan starten und jederzeit upgraden.",
      plans: {
        free: {
          label: "Free",
          price: "$0",
          description: "Das Wesentliche für konstante Planung und Veröffentlichung.",
          cta: "Kostenlos starten",
          features: {
            "0": "KI-Ideengenerierung (begrenzt)",
            "1": "Workflow-Board",
            "2": "Basis-Planung",
            "3": "Kern-Creator-Tools",
          },
        },
        pro: {
          label: "Pro",
          price: "$9/Monat",
          description: "Mehr Automatisierung und tiefere Planung.",
          cta: "Pro testen",
          features: {
            "0": "Höhere KI-Limits",
            "1": "Wettbewerber-Tracking",
            "2": "Erweiterte Kalenderansichten",
            "3": "Priorisierte Verbesserungen",
          },
        },
        creator: {
          label: "Creator",
          price: "$19/Monat",
          description: "Für Teams und ambitionierte Creator.",
          cta: "Creator wählen",
          features: {
            "0": "Team-fähige Workflows",
            "1": "Mehr Kanäle (demnächst)",
            "2": "Erweiterte Analysen (demnächst)",
            "3": "Erstklassiger Support",
          },
        },
      },
    },
    faq: {
      title: "Häufig gestellte Fragen",
      subtitle: "Alles, was du vor dem Start wissen musst.",
      items: {
        "0": {
          q: "Ist Sparkroll wirklich kostenlos?",
          a: "Ja. Der Free-Plan enthält das Core-Toolkit und begrenzte KI-Nutzung.",
        },
        "1": {
          q: "Muss ich YouTube verbinden?",
          a: "Du kannst die Landing ohne Verbindung erkunden. Verbinden schaltet Analysen und Planung frei.",
        },
        "2": {
          q: "Welche Sprachen werden unterstützt?",
          a: "Sparkroll unterstützt 9 Sprachen: Englisch, Italienisch, Spanisch, Deutsch, Französisch, Portugiesisch, Russisch, Japanisch und Chinesisch.",
        },
        "3": {
          q: "Kann ich meinen eigenen Workflow nutzen?",
          a: "Ja. Du kannst den Workflow an deinen Prozess anpassen und Status fortlaufend aktualisieren.",
        },
        "4": {
          q: "Ist es für Mobilgeräte optimiert?",
          a: "Ja. Landing und Kernscreens sind responsiv und dark-mode-freundlich.",
        },
        "5": {
          q: "Wie starte ich?",
          a: 'Klicke auf „Kostenlos starten", um die App zu öffnen und deinen nächsten Upload zu planen.',
        },
      },
    },
    finalCta: {
      title: "Bereit, konstant zu veröffentlichen?",
      subtitle: "Starte kostenlos und veröffentliche dein nächstes Video mit weniger Reibung.",
      primaryCta: "Kostenlos starten",
      secondaryCta: "Preise ansehen",
    },
    footer: {
      brand: "Sparkroll",
      tagline: "Ein kostenloses Toolkit für moderne YouTube-Creator.",
      sections: { product: "Produkt", social: "Social" },
      links: {
        features: "Funktionen",
        pricing: "Preise",
        blog: "Blog",
        login: "Anmelden",
      },
      social: { github: "GitHub", x: "X", youtube: "YouTube" },
      legal: { terms: "AGB", privacy: "Datenschutz" },
      copyright: "© {year} Sparkroll. Alle Rechte vorbehalten.",
    },
  },
  fr: {
    features: {
      title: "Tout ce qu'il faut pour grandir",
      subtitle:
        "Un ensemble ciblé d'outils pour les workflows YouTube modernes—simple, rapide et économique.",
      items: {
        ideas: {
          title: "Générateur d'idées IA",
          description: "Générez des idées et angles en secondes, puis itérez avec des prompts.",
        },
        seo: {
          title: "Titres prêts pour le SEO",
          description: "Créez de meilleurs titres, tags et descriptions avec un guide structuré.",
        },
        competitors: {
          title: "Suivi des concurrents",
          description: "Suivez les chaînes que vous admirez et apprenez de ce qui fonctionne.",
        },
        workflow: {
          title: "Workflow de production",
          description: "Scripts, notes et statuts au même endroit—du brouillon à la publication.",
        },
        calendar: {
          title: "Calendrier de publication",
          description: "Planifiez les uploads, reprogrammez par glisser-déposer et restez régulier.",
        },
        thumbnails: {
          title: "Vérification des miniatures",
          description: "Analysez les miniatures et obtenez des améliorations concrètes.",
        },
      },
    },
    how: {
      title: "Comment ça marche",
      subtitle: "Une boucle simple à répéter chaque semaine.",
      steps: {
        connect: {
          label: "Étape 1",
          title: "Connectez votre chaîne",
          description: "Connectez-vous et liez YouTube pour débloquer analyses et planification.",
        },
        build: {
          label: "Étape 2",
          title: "Planifiez avec IA + workflow",
          description: "Générez des idées, organisez les tâches et suivez les concurrents dans un hub.",
        },
        publish: {
          label: "Étape 3",
          title: "Planifiez et améliorez",
          description: "Planifiez les uploads et affinez les miniatures avec un retour rapide.",
        },
      },
    },
    comparison: {
      title: "Sparkroll vs. alternatives",
      subtitle: "Arrêtez d'assembler outils gratuits et feuilles de calcul.",
      table: { feature: "Fonctionnalité", brand: "Sparkroll", alternatives: "Autres outils" },
      rows: {
        freeTools: "Kit core gratuit",
        aiCredits: "Assistance IA intégrée",
        workflow: "Workflow + notes",
        competitors: "Suivi des concurrents",
        calendar: "Calendrier de publication",
        thumbnails: "Analyse des miniatures",
      },
    },
    testimonials: {
      title: "Les créateurs adorent la simplicité",
      subtitle: "Moins de bruit, plus de production.",
      items: {
        "0": {
          quote: "J'ai remplacé trois feuilles de calcul et deux apps en un après-midi.",
          name: "Ava",
          role: "Créatrice éducation",
        },
        "1": {
          quote: "La vue workflow garde mes uploads réguliers—même quand je suis occupé.",
          name: "Noah",
          role: "Créateur gaming",
        },
        "2": {
          quote: "Le retour sur les miniatures est rapide et actionnable. Mon CTR a augmenté.",
          name: "Mia",
          role: "Créatrice vlog",
        },
      },
    },
    pricing: {
      title: "Des tarifs simples",
      subtitle: "Commencez gratuitement. Passez au supérieur quand vous en avez besoin.",
      highlight: "Le plus populaire",
      finePrint: "Vous pouvez commencer avec le plan Free et passer au supérieur à tout moment.",
      plans: {
        free: {
          label: "Free",
          price: "$0",
          description: "L'essentiel pour planifier et publier régulièrement.",
          cta: "Commencer gratuitement",
          features: {
            "0": "Génération d'idées IA (limitée)",
            "1": "Tableau workflow",
            "2": "Planification de base",
            "3": "Outils creator essentiels",
          },
        },
        pro: {
          label: "Pro",
          price: "9 $/mois",
          description: "Plus d'automatisation et de planification avancée.",
          cta: "Essayer Pro",
          features: {
            "0": "Limites IA plus élevées",
            "1": "Suivi des concurrents",
            "2": "Vues calendrier avancées",
            "3": "Améliorations prioritaires",
          },
        },
        creator: {
          label: "Creator",
          price: "19 $/mois",
          description: "Pour les équipes et créateurs sérieux.",
          cta: "Passer à Creator",
          features: {
            "0": "Workflows prêts pour les équipes",
            "1": "Plus de chaînes (bientôt)",
            "2": "Analyses avancées (bientôt)",
            "3": "Support de premier ordre",
          },
        },
      },
    },
    faq: {
      title: "Questions fréquentes",
      subtitle: "Tout ce qu'il faut savoir avant de commencer.",
      items: {
        "0": {
          q: "Sparkroll est-il vraiment gratuit ?",
          a: "Oui. Le plan Free inclut le kit core et une utilisation IA limitée.",
        },
        "1": {
          q: "Dois-je connecter YouTube ?",
          a: "Vous pouvez explorer la landing sans connecter. Connecter débloque analyses et planification.",
        },
        "2": {
          q: "Quelles langues sont prises en charge ?",
          a: "Sparkroll prend en charge 9 langues : anglais, italien, espagnol, allemand, français, portugais, russe, japonais et chinois.",
        },
        "3": {
          q: "Puis-je utiliser mon propre workflow ?",
          a: "Oui. Vous pouvez adapter le workflow à votre processus et mettre à jour les statuts au fil du temps.",
        },
        "4": {
          q: "Est-ce optimisé pour mobile ?",
          a: "Oui. La landing et les écrans principaux sont responsives et compatibles mode sombre.",
        },
        "5": {
          q: "Comment commencer ?",
          a: 'Cliquez sur « Commencer gratuitement » pour ouvrir l\'app et planifier votre prochain upload.',
        },
      },
    },
    finalCta: {
      title: "Prêt à publier régulièrement ?",
      subtitle: "Commencez gratuitement et publiez votre prochaine vidéo avec moins de friction.",
      primaryCta: "Commencer gratuitement",
      secondaryCta: "Voir les tarifs",
    },
    footer: {
      brand: "Sparkroll",
      tagline: "Un kit gratuit pour les créateurs YouTube modernes.",
      sections: { product: "Produit", social: "Réseaux" },
      links: {
        features: "Fonctionnalités",
        pricing: "Tarifs",
        blog: "Blog",
        login: "Connexion",
      },
      social: { github: "GitHub", x: "X", youtube: "YouTube" },
      legal: { terms: "Conditions", privacy: "Confidentialité" },
      copyright: "© {year} Sparkroll. Tous droits réservés.",
    },
  },
  pt: {
    features: {
      title: "Tudo o que você precisa para crescer",
      subtitle:
        "Um conjunto focado de ferramentas para fluxos modernos no YouTube—simples, rápido e econômico.",
      items: {
        ideas: {
          title: "Gerador de ideias com IA",
          description: "Gere ideias e ângulos em segundos, depois itere com prompts.",
        },
        seo: {
          title: "Títulos prontos para SEO",
          description: "Crie melhores títulos, tags e descrições com orientação estruturada.",
        },
        competitors: {
          title: "Monitoramento de concorrentes",
          description: "Siga canais que você admira e aprenda com o que funciona.",
        },
        workflow: {
          title: "Fluxo de produção",
          description: "Roteiros, notas e status em um só lugar—do rascunho à publicação.",
        },
        calendar: {
          title: "Calendário de publicação",
          description: "Planeje uploads, reprograme com drag & drop e mantenha consistência.",
        },
        thumbnails: {
          title: "Verificação de miniaturas",
          description: "Analise miniaturas rapidamente e obtenha melhorias acionáveis.",
        },
      },
    },
    how: {
      title: "Como funciona",
      subtitle: "Um ciclo simples que você pode repetir toda semana.",
      steps: {
        connect: {
          label: "Passo 1",
          title: "Conecte seu canal",
          description: "Entre e vincule o YouTube para desbloquear análises e agendamento.",
        },
        build: {
          label: "Passo 2",
          title: "Planeje com IA + fluxo",
          description: "Gere ideias, organize tarefas e acompanhe concorrentes em um hub.",
        },
        publish: {
          label: "Passo 3",
          title: "Agende e melhore",
          description: "Agende uploads e refine miniaturas com feedback rápido.",
        },
      },
    },
    comparison: {
      title: "Sparkroll vs. alternativas",
      subtitle: "Pare de juntar ferramentas gratuitas e planilhas.",
      table: { feature: "Recurso", brand: "Sparkroll", alternatives: "Outras ferramentas" },
      rows: {
        freeTools: "Kit core gratuito",
        aiCredits: "Assistência IA integrada",
        workflow: "Fluxo + notas",
        competitors: "Monitoramento de concorrentes",
        calendar: "Calendário de publicação",
        thumbnails: "Análise de miniaturas",
      },
    },
    testimonials: {
      title: "Criadores amam o foco",
      subtitle: "Menos bagunça, mais produção.",
      items: {
        "0": {
          quote: "Substituí três planilhas e dois apps em uma tarde.",
          name: "Ava",
          role: "Criadora educacional",
        },
        "1": {
          quote: "A visão de fluxo mantém meus uploads consistentes—even quando estou ocupado.",
          name: "Noah",
          role: "Criador gaming",
        },
        "2": {
          quote: "O feedback de miniaturas é rápido e acionável. Meu CTR melhorou.",
          name: "Mia",
          role: "Criadora vlog",
        },
      },
    },
    pricing: {
      title: "Preços simples",
      subtitle: "Comece grátis. Faça upgrade quando precisar de mais.",
      highlight: "Mais popular",
      finePrint: "Você pode começar no plano Free e fazer upgrade a qualquer momento.",
      plans: {
        free: {
          label: "Free",
          price: "$0",
          description: "O essencial para planejar e publicar com consistência.",
          cta: "Começar grátis",
          features: {
            "0": "Geração de ideias IA (limitada)",
            "1": "Quadro de fluxo",
            "2": "Agendamento básico",
            "3": "Ferramentas creator essenciais",
          },
        },
        pro: {
          label: "Pro",
          price: "$9/mês",
          description: "Mais automação e planejamento profundo.",
          cta: "Experimentar Pro",
          features: {
            "0": "Limites IA mais altos",
            "1": "Monitoramento de concorrentes",
            "2": "Visualizações avançadas de calendário",
            "3": "Melhorias prioritárias",
          },
        },
        creator: {
          label: "Creator",
          price: "$19/mês",
          description: "Para equipes e criadores sérios.",
          cta: "Ir para Creator",
          features: {
            "0": "Fluxos prontos para equipes",
            "1": "Mais canais (em breve)",
            "2": "Análises avançadas (em breve)",
            "3": "Suporte de primeira classe",
          },
        },
      },
    },
    faq: {
      title: "Perguntas frequentes",
      subtitle: "Tudo o que você precisa saber antes de começar.",
      items: {
        "0": {
          q: "O Sparkroll é realmente gratuito?",
          a: "Sim. O plano Free inclui o kit core e uso limitado de IA.",
        },
        "1": {
          q: "Preciso conectar o YouTube?",
          a: "Você pode explorar a landing sem conectar. Conectar desbloqueia análises e agendamento.",
        },
        "2": {
          q: "Quais idiomas são suportados?",
          a: "O Sparkroll suporta 9 idiomas: inglês, italiano, espanhol, alemão, francês, português, russo, japonês e chinês.",
        },
        "3": {
          q: "Posso usar meu próprio fluxo?",
          a: "Sim. Você pode adaptar o fluxo ao seu processo e atualizar status conforme avança.",
        },
        "4": {
          q: "É otimizado para mobile?",
          a: "Sim. A landing e as telas principais são responsivas e compatíveis com modo escuro.",
        },
        "5": {
          q: "Como começo?",
          a: 'Clique em "Começar grátis" para abrir o app e planejar seu próximo upload.',
        },
      },
    },
    finalCta: {
      title: "Pronto para publicar com consistência?",
      subtitle: "Comece grátis e publique seu próximo vídeo com menos atrito.",
      primaryCta: "Começar grátis",
      secondaryCta: "Ver preços",
    },
    footer: {
      brand: "Sparkroll",
      tagline: "Um kit gratuito para criadores modernos do YouTube.",
      sections: { product: "Produto", social: "Redes" },
      links: {
        features: "Recursos",
        pricing: "Preços",
        blog: "Blog",
        login: "Entrar",
      },
      social: { github: "GitHub", x: "X", youtube: "YouTube" },
      legal: { terms: "Termos", privacy: "Privacidade" },
      copyright: "© {year} Sparkroll. Todos os direitos reservados.",
    },
  },
  ru: {
    features: {
      title: "Всё необходимое для роста",
      subtitle:
        "Сфокусированный набор инструментов для современных YouTube-процессов—простой, быстрый и экономичный.",
      items: {
        ideas: {
          title: "Генератор идей на ИИ",
          description: "Создавайте идеи и углы за секунды, затем дорабатывайте с промптами.",
        },
        seo: {
          title: "SEO-готовые заголовки",
          description: "Создавайте лучшие заголовки, теги и описания со структурированной подсказкой.",
        },
        competitors: {
          title: "Отслеживание конкурентов",
          description: "Следите за каналами, которыми восхищаетесь, и учитесь у лучших.",
        },
        workflow: {
          title: "Производственный workflow",
          description: "Сценарии, заметки и статусы в одном месте—от черновика до публикации.",
        },
        calendar: {
          title: "Календарь публикаций",
          description: "Планируйте загрузки, переносите drag & drop и оставайтесь последовательными.",
        },
        thumbnails: {
          title: "Проверка превью",
          description: "Быстро анализируйте превью и получайте конкретные улучшения.",
        },
      },
    },
    how: {
      title: "Как это работает",
      subtitle: "Простой цикл, который можно повторять каждую неделю.",
      steps: {
        connect: {
          label: "Шаг 1",
          title: "Подключите канал",
          description: "Войдите и свяжите YouTube, чтобы открыть аналитику и планирование.",
        },
        build: {
          label: "Шаг 2",
          title: "Планируйте с ИИ и workflow",
          description: "Генерируйте идеи, организуйте задачи и отслеживайте конкурентов в одном хабе.",
        },
        publish: {
          label: "Шаг 3",
          title: "Планируйте и улучшайте",
          description: "Планируйте загрузки и улучшайте превью с быстрой обратной связью.",
        },
      },
    },
    comparison: {
      title: "Sparkroll vs. альтернативы",
      subtitle: "Хватит склеивать бесплатные инструменты и таблицы.",
      table: { feature: "Функция", brand: "Sparkroll", alternatives: "Другие инструменты" },
      rows: {
        freeTools: "Бесплатный базовый набор",
        aiCredits: "Встроенная ИИ-помощь",
        workflow: "Workflow + заметки",
        competitors: "Отслеживание конкурентов",
        calendar: "Календарь публикаций",
        thumbnails: "Анализ превью",
      },
    },
    testimonials: {
      title: "Создателям нравится фокус",
      subtitle: "Меньше хаоса, больше результата.",
      items: {
        "0": {
          quote: "За один день заменил три таблицы и два приложения.",
          name: "Ава",
          role: "Образовательный автор",
        },
        "1": {
          quote: "Вид workflow помогает публиковать регулярно—даже когда занят.",
          name: "Ноа",
          role: "Игровой автор",
        },
        "2": {
          quote: "Обратная связь по превью быстрая и полезная. CTR вырос.",
          name: "Миа",
          role: "Влогер",
        },
      },
    },
    pricing: {
      title: "Простые цены",
      subtitle: "Начните бесплатно. Переходите на платный план, когда нужно больше.",
      highlight: "Самый популярный",
      finePrint: "Можно начать с Free и перейти на платный план в любой момент.",
      plans: {
        free: {
          label: "Free",
          price: "$0",
          description: "Необходимое для регулярного планирования и публикации.",
          cta: "Начать бесплатно",
          features: {
            "0": "Генерация идей ИИ (ограничено)",
            "1": "Доска workflow",
            "2": "Базовое планирование",
            "3": "Основные инструменты автора",
          },
        },
        pro: {
          label: "Pro",
          price: "$9/мес",
          description: "Больше автоматизации и глубокого планирования.",
          cta: "Попробовать Pro",
          features: {
            "0": "Повышенные лимиты ИИ",
            "1": "Отслеживание конкурентов",
            "2": "Расширенные виды календаря",
            "3": "Приоритетные улучшения",
          },
        },
        creator: {
          label: "Creator",
          price: "$19/мес",
          description: "Для команд и серьёзных авторов.",
          cta: "Перейти на Creator",
          features: {
            "0": "Workflow для команд",
            "1": "Больше каналов (скоро)",
            "2": "Расширенная аналитика (скоро)",
            "3": "Поддержка высшего уровня",
          },
        },
      },
    },
    faq: {
      title: "Частые вопросы",
      subtitle: "Всё, что нужно знать перед стартом.",
      items: {
        "0": {
          q: "Sparkroll действительно бесплатен?",
          a: "Да. План Free включает базовый набор и ограниченное использование ИИ.",
        },
        "1": {
          q: "Нужно ли подключать YouTube?",
          a: "Можно изучить лендинг без подключения. Подключение открывает аналитику и планирование.",
        },
        "2": {
          q: "Какие языки поддерживаются?",
          a: "Sparkroll поддерживает 9 языков: английский, итальянский, испанский, немецкий, французский, португальский, русский, японский и китайский.",
        },
        "3": {
          q: "Можно ли использовать свой workflow?",
          a: "Да. Вы можете адаптировать workflow под свой процесс и обновлять статусы по ходу.",
        },
        "4": {
          q: "Оптимизировано ли для мобильных?",
          a: "Да. Лендинг и основные экраны адаптивны и поддерживают тёмную тему.",
        },
        "5": {
          q: "Как начать?",
          a: 'Нажмите «Начать бесплатно», чтобы открыть приложение и спланировать следующую публикацию.',
        },
      },
    },
    finalCta: {
      title: "Готовы публиковать регулярно?",
      subtitle: "Начните бесплатно и выпустите следующее видео с меньшими усилиями.",
      primaryCta: "Начать бесплатно",
      secondaryCta: "Смотреть цены",
    },
    footer: {
      brand: "Sparkroll",
      tagline: "Бесплатный набор для современных YouTube-авторов.",
      sections: { product: "Продукт", social: "Соцсети" },
      links: {
        features: "Функции",
        pricing: "Цены",
        blog: "Блог",
        login: "Войти",
      },
      social: { github: "GitHub", x: "X", youtube: "YouTube" },
      legal: { terms: "Условия", privacy: "Конфиденциальность" },
      copyright: "© {year} Sparkroll. Все права защищены.",
    },
  },
  ja: {
    features: {
      title: "成長に必要なすべて",
      subtitle: "現代のYouTubeワークフロー向けの厳選ツール—シンプル、高速、コスト意識。",
      items: {
        ideas: {
          title: "AIアイデア生成",
          description: "数秒で動画のアイデアと切り口を生成し、プロンプトで反復改善。",
        },
        seo: {
          title: "SEO対応タイトル",
          description: "構造化ガイドでより良いタイトル、タグ、説明文を作成。",
        },
        competitors: {
          title: "競合チャンネル追跡",
          description: "憧れのチャンネルをフォローし、成功パターンを学ぶ。",
        },
        workflow: {
          title: "制作ワークフロー",
          description: "脚本、メモ、ステータスを一箇所で管理—下書きから公開まで。",
        },
        calendar: {
          title: "公開スケジュール",
          description: "アップロードを計画し、ドラッグ＆ドロップで変更、継続的に公開。",
        },
        thumbnails: {
          title: "サムネイルチェック",
          description: "サムネイルを素早く分析し、実行可能な改善点を取得。",
        },
      },
    },
    how: {
      title: "使い方",
      subtitle: "毎週繰り返せるシンプルなループ。",
      steps: {
        connect: {
          label: "ステップ 1",
          title: "チャンネルを接続",
          description: "サインインしてYouTubeを連携し、分析とスケジュールを解放。",
        },
        build: {
          label: "ステップ 2",
          title: "AIとワークフローで計画",
          description: "アイデア生成、タスク整理、競合追跡を一つのハブで。",
        },
        publish: {
          label: "ステップ 3",
          title: "スケジュールと改善",
          description: "アップロードを予定し、迅速なフィードバックでサムネイルを改善。",
        },
      },
    },
    comparison: {
      title: "Sparkroll vs. 代替ツール",
      subtitle: "無料ツールとスプレッドシートの寄せ集めはもう終わり。",
      table: { feature: "機能", brand: "Sparkroll", alternatives: "他のツール" },
      rows: {
        freeTools: "無料コアツールキット",
        aiCredits: "組み込みAIアシスト",
        workflow: "ワークフロー＋メモ",
        competitors: "競合追跡",
        calendar: "公開カレンダー",
        thumbnails: "サムネイル分析",
      },
    },
    testimonials: {
      title: "クリエイターに好評の集中設計",
      subtitle: "雑然としすぎず、成果を出す。",
      items: {
        "0": {
          quote: "午後のうちにスプレッドシート3つとアプリ2つを置き換えました。",
          name: "Ava",
          role: "教育系クリエイター",
        },
        "1": {
          quote: "ワークフロー画面で忙しくても安定してアップロードできています。",
          name: "Noah",
          role: "ゲーム系クリエイター",
        },
        "2": {
          quote: "サムネイルのフィードバックが速く具体的。CTRが改善しました。",
          name: "Mia",
          role: "Vlogクリエイター",
        },
      },
    },
    pricing: {
      title: "シンプルな料金",
      subtitle: "無料で開始。必要になったらアップグレード。",
      highlight: "人気No.1",
      finePrint: "Freeプランから始めていつでもアップグレードできます。",
      plans: {
        free: {
          label: "Free",
          price: "$0",
          description: "継続的に計画・公開するための基本機能。",
          cta: "無料で開始",
          features: {
            "0": "AIアイデア生成（制限あり）",
            "1": "ワークフローボード",
            "2": "基本スケジュール",
            "3": "コアクリエイターツール",
          },
        },
        pro: {
          label: "Pro",
          price: "$9/月",
          description: "より多くの自動化と深い計画機能。",
          cta: "Proを試す",
          features: {
            "0": "より高いAI上限",
            "1": "競合追跡",
            "2": "高度なカレンダービュー",
            "3": "優先的な改善",
          },
        },
        creator: {
          label: "Creator",
          price: "$19/月",
          description: "チームや本格的なクリエイター向け。",
          cta: "Creatorへ",
          features: {
            "0": "チーム対応ワークフロー",
            "1": "複数チャンネル（近日）",
            "2": "高度な分析（近日）",
            "3": "最高水準のサポート",
          },
        },
      },
    },
    faq: {
      title: "よくある質問",
      subtitle: "始める前に知っておきたいこと。",
      items: {
        "0": {
          q: "Sparkrollは本当に無料ですか？",
          a: "はい。Freeプランにはコアツールキットと制限付きAI利用が含まれます。",
        },
        "1": {
          q: "YouTubeの接続は必要ですか？",
          a: "接続なしでランディングを確認できます。接続すると分析とスケジュールが使えます。",
        },
        "2": {
          q: "対応言語は？",
          a: "Sparkrollは英語、イタリア語、スペイン語、ドイツ語、フランス語、ポルトガル語、ロシア語、日本語、中国語の9言語に対応しています。",
        },
        "3": {
          q: "自分のワークフローを使えますか？",
          a: "はい。制作プロセスに合わせてワークフローを調整し、ステータスを更新できます。",
        },
        "4": {
          q: "モバイル最適化されていますか？",
          a: "はい。ランディングと主要画面はレスポンシブでダークモード対応です。",
        },
        "5": {
          q: "始め方は？",
          a: "「無料で開始」をクリックしてアプリを開き、次のアップロードを計画しましょう。",
        },
      },
    },
    finalCta: {
      title: "継続的に公開する準備はできましたか？",
      subtitle: "無料で始めて、次の動画をよりスムーズに公開。",
      primaryCta: "無料で開始",
      secondaryCta: "料金を見る",
    },
    footer: {
      brand: "Sparkroll",
      tagline: "現代のYouTubeクリエイター向け無料ツールキット。",
      sections: { product: "プロダクト", social: "ソーシャル" },
      links: {
        features: "機能",
        pricing: "料金",
        blog: "ブログ",
        login: "ログイン",
      },
      social: { github: "GitHub", x: "X", youtube: "YouTube" },
      legal: { terms: "利用規約", privacy: "プライバシー" },
      copyright: "© {year} Sparkroll. All rights reserved.",
    },
  },
  zh: {
    features: {
      title: "成长所需的一切",
      subtitle: "为现代 YouTube 工作流打造的精简工具集—简单、快速、注重成本。",
      items: {
        ideas: {
          title: "AI 创意生成",
          description: "数秒内生成视频创意与角度，再用提示词迭代优化。",
        },
        seo: {
          title: "SEO 就绪标题",
          description: "通过结构化指引撰写更好的标题、标签和描述。",
        },
        competitors: {
          title: "竞品频道追踪",
          description: "关注你欣赏的频道，学习有效做法。",
        },
        workflow: {
          title: "制作工作流",
          description: "脚本、笔记和状态集中管理—从草稿到发布。",
        },
        calendar: {
          title: "发布日历",
          description: "规划上传、拖拽改期，保持稳定更新。",
        },
        thumbnails: {
          title: "缩略图检查",
          description: "快速分析缩略图并获得可执行的改进建议。",
        },
      },
    },
    how: {
      title: "如何运作",
      subtitle: "每周可重复的简单循环。",
      steps: {
        connect: {
          label: "步骤 1",
          title: "连接你的频道",
          description: "登录并关联 YouTube，解锁分析与排期功能。",
        },
        build: {
          label: "步骤 2",
          title: "用 AI 与工作流规划",
          description: "在一个中心生成创意、整理任务并追踪竞品。",
        },
        publish: {
          label: "步骤 3",
          title: "排期并持续优化",
          description: "安排上传并通过快速反馈优化缩略图。",
        },
      },
    },
    comparison: {
      title: "Sparkroll 对比其他方案",
      subtitle: "别再拼凑免费工具和电子表格。",
      table: { feature: "功能", brand: "Sparkroll", alternatives: "其他工具" },
      rows: {
        freeTools: "免费核心工具包",
        aiCredits: "内置 AI 辅助",
        workflow: "工作流 + 笔记",
        competitors: "竞品追踪",
        calendar: "发布日历",
        thumbnails: "缩略图分析",
      },
    },
    testimonials: {
      title: "创作者喜爱这种专注",
      subtitle: "更少杂乱，更高产出。",
      items: {
        "0": {
          quote: "一个下午就替换了三张表格和两个应用。",
          name: "Ava",
          role: "教育类创作者",
        },
        "1": {
          quote: "工作流视图让我即使忙碌也能稳定上传。",
          name: "Noah",
          role: "游戏类创作者",
        },
        "2": {
          quote: "缩略图反馈快速且可执行，我的 CTR 提升了。",
          name: "Mia",
          role: "Vlog 创作者",
        },
      },
    },
    pricing: {
      title: "简单定价",
      subtitle: "免费起步，需要时再升级。",
      highlight: "最受欢迎",
      finePrint: "可从 Free 计划开始，随时升级。",
      plans: {
        free: {
          label: "Free",
          price: "$0",
          description: "稳定规划与发布的基础功能。",
          cta: "免费开始",
          features: {
            "0": "AI 创意生成（有限）",
            "1": "工作流看板",
            "2": "基础排期",
            "3": "核心创作者工具",
          },
        },
        pro: {
          label: "Pro",
          price: "$9/月",
          description: "更多自动化与深度规划。",
          cta: "试用 Pro",
          features: {
            "0": "更高 AI 限额",
            "1": "竞品追踪",
            "2": "高级日历视图",
            "3": "优先功能改进",
          },
        },
        creator: {
          label: "Creator",
          price: "$19/月",
          description: "适合团队与专业创作者。",
          cta: "选择 Creator",
          features: {
            "0": "团队就绪工作流",
            "1": "更多频道（即将推出）",
            "2": "增强分析（即将推出）",
            "3": "一流支持",
          },
        },
      },
    },
    faq: {
      title: "常见问题",
      subtitle: "开始前你需要了解的一切。",
      items: {
        "0": {
          q: "Sparkroll 真的免费吗？",
          a: "是的。Free 计划包含核心工具包和有限 AI 用量。",
        },
        "1": {
          q: "必须连接 YouTube 吗？",
          a: "不连接也可浏览落地页。连接后可解锁分析与排期。",
        },
        "2": {
          q: "支持哪些语言？",
          a: "Sparkroll 支持 9 种语言：英语、意大利语、西班牙语、德语、法语、葡萄牙语、俄语、日语和中文。",
        },
        "3": {
          q: "可以使用自己的工作流吗？",
          a: "可以。你可按制作流程调整工作流并随时更新状态。",
        },
        "4": {
          q: "是否针对移动端优化？",
          a: "是的。落地页和核心界面均响应式并支持深色模式。",
        },
        "5": {
          q: "如何开始？",
          a: "点击“免费开始”打开应用，规划你的下一次上传。",
        },
      },
    },
    finalCta: {
      title: "准备好持续发布了吗？",
      subtitle: "免费开始，更顺畅地发布下一个视频。",
      primaryCta: "免费开始",
      secondaryCta: "查看定价",
    },
    footer: {
      brand: "Sparkroll",
      tagline: "面向现代 YouTube 创作者的免费工具包。",
      sections: { product: "产品", social: "社交" },
      links: {
        features: "功能",
        pricing: "定价",
        blog: "博客",
        login: "登录",
      },
      social: { github: "GitHub", x: "X", youtube: "YouTube" },
      legal: { terms: "条款", privacy: "隐私" },
      copyright: "© {year} Sparkroll. 保留所有权利。",
    },
  },
};

// Rebrand + update en.json comparison key
const enPatch = {
  landing: {
    brand: BRAND,
    meta: {
      title: "Sparkroll — Free AI YouTube creator toolkit",
      description:
        "Plan, research, and ship better videos with a free toolkit: idea generation, workflow, competitor tracking, scheduling, and thumbnail checks.",
    },
    structuredData: {
      name: BRAND,
      description: "Free AI-powered YouTube creator toolkit for ideas, planning, and optimization.",
    },
    hero: {
      subtitle:
        "From ideas to schedule: Sparkroll helps you plan, optimize, and publish consistently—without juggling ten tools.",
      mockAlt: "Sparkroll dashboard mockup",
    },
    comparison: {
      title: "Sparkroll vs. alternatives",
      table: { feature: "Feature", brand: BRAND, alternatives: "Other tools" },
    },
    faq: {
      items: {
        "0": { q: "Is Sparkroll really free?", a: "Yes. The Free plan includes the core toolkit and limited AI usage." },
        "2": {
          a: "Sparkroll supports 9 languages including English, Italian, Spanish, German, French, Portuguese, Russian, Japanese, and Chinese.",
        },
      },
    },
    footer: {
      brand: BRAND,
      copyright: "© {year} Sparkroll. All rights reserved.",
    },
  },
};

for (const locale of ["en", "it", "es", "de", "fr", "pt", "ru", "ja", "zh"]) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  let data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  // Global rebrand in all string values
  const json = JSON.stringify(data);
  data = JSON.parse(json.replaceAll("VidPulse", BRAND).replaceAll("vidPulse", "brand"));

  if (locale === "en") {
    deepMerge(data, enPatch);
  } else if (landingSections[locale]) {
    deepMerge(data, { landing: landingSections[locale] });
    // Update hero/meta brand references already handled by global replace
    if (data.landing?.hero?.subtitle?.includes(BRAND) === false && locale !== "en") {
      data.landing.hero.subtitle = data.landing.hero.subtitle.replaceAll("VidPulse", BRAND);
    }
  }

  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Patched ${locale}.json`);
}

console.log("Landing i18n + Sparkroll rebrand complete.");
