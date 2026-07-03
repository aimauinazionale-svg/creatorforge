import fs from "node:fs";
import path from "node:path";

const messagesDir = path.join(process.cwd(), "messages");

/** Deep-merge source into target (overwrites leaf values). */
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

const patches = {
  it: {
    layout: {
      nav: { dashboard: "Dashboard", onboarding: "Configurazione iniziale" },
      breadcrumb: { onboarding: "Configurazione iniziale" },
    },
    dashboard: {
      title: "Dashboard",
      subtitle: "Collega il tuo canale YouTube per vedere le statistiche e sincronizzare i video.",
    },
    landing: {
      meta: {
        title: "VidPulse — Toolkit gratuito per creator YouTube con IA",
        description:
          "Pianifica, ricerca e pubblica video migliori con un toolkit gratuito: idee, workflow, competitor, calendario e analisi miniature.",
      },
      structuredData: {
        description:
          "Toolkit gratuito con IA per creator YouTube: idee, pianificazione e ottimizzazione.",
      },
      nav: {
        aria: "Navigazione principale",
        features: "Funzionalità",
        pricing: "Prezzi",
        blog: "Blog",
        login: "Accedi",
      },
      cta: { getStartedFree: "Inizia gratis" },
      hero: {
        kicker: "Pubblica video migliori, più in fretta",
        title: "Il tuo toolkit per creator, gratuito e con IA",
        subtitle:
          "Dalle idee al calendario: VidPulse ti aiuta a pianificare, ottimizzare e pubblicare con costanza—senza dieci strumenti diversi.",
        primaryCta: "Inizia gratis",
        secondaryCta: "Vedi i prezzi",
        mockAlt: "Anteprima dashboard VidPulse",
        bullets: {
          "0": "Gratis per iniziare",
          "1": "Progettato per la velocità",
          "2": "Disponibile in 9 lingue",
        },
      },
    },
    onboarding: {
      title: "Benvenuto su VidPulse",
      subtitle: "Configuriamo il tuo spazio di lavoro in pochi passaggi.",
      progress: {
        welcome: "Benvenuto",
        connect: "Collega YouTube",
        goals: "Obiettivi",
        channel: "Info canale",
        personalize: "Personalizzazione",
        complete: "Completato",
      },
      actions: { back: "Indietro", next: "Avanti", skip: "Salta", finish: "Fine" },
      validation: {
        generic: "Controlla le risposte e riprova.",
        goalsMinOne: "Seleziona almeno un obiettivo o aggiungine uno personalizzato.",
        channelInfo: "Compila tutti i campi del canale (minimo 2 caratteri ciascuno).",
      },
      errors: {
        UNAUTHENTICATED: "Accedi per continuare la configurazione.",
        DB_ERROR: "Non siamo riusciti a salvare i progressi. Riprova.",
        INVALID_STEP: "Passaggio di configurazione non valido.",
      },
      steps: {
        welcome: {
          title: "Iniziamo la configurazione",
          subtitle: "Così VidPulse può adattare i suggerimenti al tuo canale.",
          bullets: {
            youtube: "Collega YouTube per sbloccare analisi e sincronizzazione.",
            goals: "Scegli obiettivi per ottimizzare il tuo workflow.",
            personalize: "Scegli notifiche e frequenza email.",
          },
        },
        connectYouTube: {
          title: "Collega YouTube",
          subtitle: "Opzionale, ma consigliato per sbloccare la dashboard.",
        },
        goals: {
          title: "I tuoi obiettivi",
          subtitle: "Selezionane almeno uno per personalizzare i consigli.",
          options: {
            grow: "Far crescere iscritti e visualizzazioni",
            consistent: "Pubblicare con più costanza",
            monetize: "Monetizzare il canale",
            workflow: "Migliorare workflow e pianificazione",
          },
          custom: {
            label: "Obiettivo personalizzato (opzionale)",
            placeholder: "es. migliorare la retention nei primi 30 secondi",
            hint: "Se nessuna opzione va bene, aggiungi il tuo obiettivo.",
          },
        },
        channelInfo: {
          title: "Info sul canale",
          subtitle: "Alcuni dettagli ci aiutano a personalizzare idee e modelli.",
          fields: {
            niche: { label: "Nicchia", placeholder: "es. fitness, recensioni tech, cucina" },
            audience: { label: "Pubblico", placeholder: "es. principianti, creator, genitori" },
            frequency: { label: "Frequenza di upload", placeholder: "es. 2 video/settimana" },
            experience: { label: "Livello di esperienza", placeholder: "es. nuovo, intermedio, esperto" },
          },
        },
        personalization: {
          title: "Personalizzazione",
          subtitle: "Scegli come vuoi ricevere aggiornamenti da noi.",
          emailFrequency: {
            label: "Frequenza email",
            hint: "Puoi cambiarla in qualsiasi momento nelle impostazioni.",
            options: {
              daily: "Giornaliera",
              weekly: "Settimanale",
              monthly: "Mensile",
              never: "Mai",
            },
          },
        },
        complete: {
          title: "Tutto pronto!",
          subtitle: "Abbiamo salvato le tue preferenze. Reindirizzamento alla dashboard…",
        },
      },
    },
  },
  es: {
    layout: {
      nav: { onboarding: "Configuración inicial" },
      breadcrumb: { onboarding: "Configuración inicial" },
    },
    dashboard: {
      title: "Panel",
      subtitle: "Conecta tu canal de YouTube para ver estadísticas y sincronizar videos.",
    },
    landing: {
      meta: {
        title: "VidPulse — Kit gratuito para creadores de YouTube con IA",
        description:
          "Planifica, investiga y publica mejores videos con un kit gratuito: ideas, flujo de trabajo, competidores, calendario y análisis de miniaturas.",
      },
      structuredData: {
        description: "Kit gratuito con IA para creadores de YouTube: ideas, planificación y optimización.",
      },
      nav: {
        aria: "Navegación principal",
        features: "Funciones",
        pricing: "Precios",
        blog: "Blog",
        login: "Iniciar sesión",
      },
      cta: { getStartedFree: "Empezar gratis" },
      hero: {
        kicker: "Publica mejores videos, más rápido",
        title: "Tu kit de creador gratuito con IA",
        subtitle:
          "De la idea al calendario: VidPulse te ayuda a planificar, optimizar y publicar con constancia—sin diez herramientas distintas.",
        primaryCta: "Empezar gratis",
        secondaryCta: "Ver precios",
        mockAlt: "Vista previa del panel de VidPulse",
        bullets: { "0": "Gratis para empezar", "1": "Diseñado para la velocidad", "2": "Disponible en 9 idiomas" },
      },
    },
    onboarding: {
      title: "Bienvenido a VidPulse",
      subtitle: "Configuremos tu espacio de trabajo en unos pocos pasos.",
      progress: {
        welcome: "Bienvenida",
        connect: "Conectar YouTube",
        goals: "Objetivos",
        channel: "Info del canal",
        personalize: "Personalización",
        complete: "Completado",
      },
      actions: { back: "Atrás", next: "Siguiente", skip: "Omitir", finish: "Finalizar" },
      validation: {
        generic: "Revisa tus respuestas e inténtalo de nuevo.",
        goalsMinOne: "Selecciona al menos un objetivo o añade uno personalizado.",
        channelInfo: "Completa todos los campos del canal (mínimo 2 caracteres cada uno).",
      },
      errors: {
        UNAUTHENTICATED: "Inicia sesión para continuar la configuración.",
        DB_ERROR: "No pudimos guardar tu progreso. Inténtalo de nuevo.",
        INVALID_STEP: "Paso de configuración no válido.",
      },
      steps: {
        welcome: {
          title: "Empecemos la configuración",
          subtitle: "Esto ayuda a VidPulse a adaptar las sugerencias a tu canal.",
          bullets: {
            youtube: "Conecta YouTube para desbloquear analíticas y sincronización.",
            goals: "Elige objetivos para optimizar tu flujo de trabajo.",
            personalize: "Elige notificaciones y frecuencia de correo.",
          },
        },
        connectYouTube: {
          title: "Conectar YouTube",
          subtitle: "Opcional, pero recomendado para desbloquear el panel.",
        },
        goals: {
          title: "Tus objetivos",
          subtitle: "Elige al menos uno para personalizar las recomendaciones.",
          options: {
            grow: "Hacer crecer suscriptores y vistas",
            consistent: "Publicar con más constancia",
            monetize: "Monetizar el canal",
            workflow: "Mejorar flujo de trabajo y planificación",
          },
          custom: {
            label: "Objetivo personalizado (opcional)",
            placeholder: "ej. mejorar la retención en los primeros 30 segundos",
            hint: "Si ninguna opción encaja, añade el tuyo.",
          },
        },
        channelInfo: {
          title: "Información del canal",
          subtitle: "Algunos detalles nos ayudan a personalizar ideas y plantillas.",
          fields: {
            niche: { label: "Nicho", placeholder: "ej. fitness, reseñas tech, cocina" },
            audience: { label: "Audiencia", placeholder: "ej. principiantes, creadores, padres" },
            frequency: { label: "Frecuencia de subida", placeholder: "ej. 2 videos/semana" },
            experience: { label: "Nivel de experiencia", placeholder: "ej. nuevo, intermedio, experto" },
          },
        },
        personalization: {
          title: "Personalización",
          subtitle: "Elige cómo quieres recibir noticias nuestras.",
          emailFrequency: {
            label: "Frecuencia de correo",
            hint: "Puedes cambiarlo en cualquier momento en ajustes.",
            options: { daily: "Diaria", weekly: "Semanal", monthly: "Mensual", never: "Nunca" },
          },
        },
        complete: {
          title: "¡Todo listo!",
          subtitle: "Guardamos tus preferencias. Redirigiendo al panel…",
        },
      },
    },
  },
  de: {
    layout: {
      nav: { onboarding: "Ersteinrichtung" },
      breadcrumb: { onboarding: "Ersteinrichtung" },
    },
    dashboard: {
      title: "Dashboard",
      subtitle: "Verbinde deinen YouTube-Kanal, um Statistiken zu sehen und Videos zu synchronisieren.",
    },
    landing: {
      meta: {
        title: "VidPulse — Kostenloses KI-Toolkit für YouTube-Creator",
        description:
          "Plane, recherchiere und veröffentliche bessere Videos mit einem kostenlosen Toolkit: Ideen, Workflow, Wettbewerber, Kalender und Thumbnail-Checks.",
      },
      structuredData: {
        description: "Kostenloses KI-Toolkit für YouTube-Creator: Ideen, Planung und Optimierung.",
      },
      nav: {
        aria: "Hauptnavigation",
        features: "Funktionen",
        pricing: "Preise",
        blog: "Blog",
        login: "Anmelden",
      },
      cta: { getStartedFree: "Kostenlos starten" },
      hero: {
        kicker: "Bessere Videos, schneller veröffentlichen",
        title: "Dein kostenloses KI-Creator-Toolkit",
        subtitle:
          "Von der Idee bis zum Zeitplan: VidPulse hilft dir, konsistent zu planen, optimieren und veröffentlichen—ohne zehn Tools.",
        primaryCta: "Kostenlos starten",
        secondaryCta: "Preise ansehen",
        mockAlt: "VidPulse-Dashboard-Vorschau",
        bullets: { "0": "Kostenlos starten", "1": "Für Geschwindigkeit gebaut", "2": "In 9 Sprachen verfügbar" },
      },
    },
    onboarding: {
      title: "Willkommen bei VidPulse",
      subtitle: "Richten wir deinen Arbeitsbereich in wenigen Schritten ein.",
      progress: {
        welcome: "Willkommen",
        connect: "YouTube verbinden",
        goals: "Ziele",
        channel: "Kanalinfo",
        personalize: "Personalisierung",
        complete: "Fertig",
      },
      actions: { back: "Zurück", next: "Weiter", skip: "Überspringen", finish: "Abschließen" },
      validation: {
        generic: "Bitte überprüfe deine Angaben und versuche es erneut.",
        goalsMinOne: "Wähle mindestens ein Ziel oder füge ein eigenes hinzu.",
        channelInfo: "Bitte fülle alle Kanalfelder aus (mindestens 2 Zeichen je Feld).",
      },
      errors: {
        UNAUTHENTICATED: "Bitte melde dich an, um die Einrichtung fortzusetzen.",
        DB_ERROR: "Fortschritt konnte nicht gespeichert werden. Bitte erneut versuchen.",
        INVALID_STEP: "Ungültiger Einrichtungsschritt.",
      },
      steps: {
        welcome: {
          title: "Lass uns starten",
          subtitle: "So kann VidPulse Vorschläge auf deinen Kanal abstimmen.",
          bullets: {
            youtube: "Verbinde YouTube für Analysen und Synchronisierung.",
            goals: "Wähle Ziele, um deinen Workflow zu optimieren.",
            personalize: "Wähle Benachrichtigungen und E-Mail-Häufigkeit.",
          },
        },
        connectYouTube: {
          title: "YouTube verbinden",
          subtitle: "Optional, aber empfohlen für dein Dashboard.",
        },
        goals: {
          title: "Deine Ziele",
          subtitle: "Wähle mindestens eines für personalisierte Empfehlungen.",
          options: {
            grow: "Abonnenten und Aufrufe steigern",
            consistent: "Konstanter veröffentlichen",
            monetize: "Kanal monetarisieren",
            workflow: "Workflow und Planung verbessern",
          },
          custom: {
            label: "Eigenes Ziel (optional)",
            placeholder: "z. B. Retention in den ersten 30 Sekunden verbessern",
            hint: "Wenn keine Option passt, füge dein eigenes Ziel hinzu.",
          },
        },
        channelInfo: {
          title: "Kanalinfo",
          subtitle: "Ein paar Details helfen uns, Ideen und Vorlagen anzupassen.",
          fields: {
            niche: { label: "Nische", placeholder: "z. B. Fitness, Tech-Reviews, Kochen" },
            audience: { label: "Zielgruppe", placeholder: "z. B. Anfänger, Creator, Eltern" },
            frequency: { label: "Upload-Häufigkeit", placeholder: "z. B. 2 Videos/Woche" },
            experience: { label: "Erfahrungslevel", placeholder: "z. B. neu, mittel, Profi" },
          },
        },
        personalization: {
          title: "Personalisierung",
          subtitle: "Wähle, wie du von uns hören möchtest.",
          emailFrequency: {
            label: "E-Mail-Häufigkeit",
            hint: "Du kannst das jederzeit in den Einstellungen ändern.",
            options: { daily: "Täglich", weekly: "Wöchentlich", monthly: "Monatlich", never: "Nie" },
          },
        },
        complete: {
          title: "Alles erledigt!",
          subtitle: "Deine Einstellungen wurden gespeichert. Weiterleitung zum Dashboard…",
        },
      },
    },
  },
  fr: {
    layout: {
      nav: { onboarding: "Intégration" },
      breadcrumb: { onboarding: "Intégration" },
    },
    dashboard: {
      title: "Tableau de bord",
      subtitle: "Connectez votre chaîne YouTube pour voir les statistiques et synchroniser les vidéos.",
    },
    landing: {
      meta: {
        title: "VidPulse — Boîte à outils gratuite pour créateurs YouTube avec IA",
        description:
          "Planifiez, recherchez et publiez de meilleures vidéos avec un kit gratuit : idées, workflow, concurrents, calendrier et analyse de miniatures.",
      },
      structuredData: {
        description: "Boîte à outils IA gratuite pour créateurs YouTube : idées, planification et optimisation.",
      },
      nav: {
        aria: "Navigation principale",
        features: "Fonctionnalités",
        pricing: "Tarifs",
        blog: "Blog",
        login: "Connexion",
      },
      cta: { getStartedFree: "Commencer gratuitement" },
      hero: {
        kicker: "De meilleures vidéos, plus vite",
        title: "Votre boîte à outils créateur gratuite avec IA",
        subtitle:
          "Des idées au calendrier : VidPulse vous aide à planifier, optimiser et publier régulièrement—sans dix outils différents.",
        primaryCta: "Commencer gratuitement",
        secondaryCta: "Voir les tarifs",
        mockAlt: "Aperçu du tableau de bord VidPulse",
        bullets: { "0": "Gratuit pour commencer", "1": "Conçu pour la vitesse", "2": "Disponible en 9 langues" },
      },
    },
    onboarding: {
      title: "Bienvenue sur VidPulse",
      subtitle: "Configurons votre espace de travail en quelques étapes.",
      progress: {
        welcome: "Bienvenue",
        connect: "Connecter YouTube",
        goals: "Objectifs",
        channel: "Infos chaîne",
        personalize: "Personnalisation",
        complete: "Terminé",
      },
      actions: { back: "Retour", next: "Suivant", skip: "Passer", finish: "Terminer" },
      validation: {
        generic: "Vérifiez vos réponses et réessayez.",
        goalsMinOne: "Sélectionnez au moins un objectif ou ajoutez-en un personnalisé.",
        channelInfo: "Remplissez tous les champs de la chaîne (min. 2 caractères chacun).",
      },
      errors: {
        UNAUTHENTICATED: "Connectez-vous pour continuer l'intégration.",
        DB_ERROR: "Impossible d'enregistrer votre progression. Réessayez.",
        INVALID_STEP: "Étape d'intégration invalide.",
      },
      steps: {
        welcome: {
          title: "Commençons la configuration",
          subtitle: "Cela aide VidPulse à adapter les suggestions à votre chaîne.",
          bullets: {
            youtube: "Connectez YouTube pour débloquer analyses et synchronisation.",
            goals: "Choisissez des objectifs pour optimiser votre workflow.",
            personalize: "Choisissez notifications et fréquence des e-mails.",
          },
        },
        connectYouTube: {
          title: "Connecter YouTube",
          subtitle: "Optionnel, mais recommandé pour débloquer le tableau de bord.",
        },
        goals: {
          title: "Vos objectifs",
          subtitle: "Choisissez au moins un objectif pour personnaliser les recommandations.",
          options: {
            grow: "Augmenter abonnés et vues",
            consistent: "Publier plus régulièrement",
            monetize: "Monétiser la chaîne",
            workflow: "Améliorer workflow et planification",
          },
          custom: {
            label: "Objectif personnalisé (optionnel)",
            placeholder: "ex. améliorer la rétention dans les 30 premières secondes",
            hint: "Si aucune option ne convient, ajoutez le vôtre.",
          },
        },
        channelInfo: {
          title: "Infos sur la chaîne",
          subtitle: "Quelques détails nous aident à personnaliser idées et modèles.",
          fields: {
            niche: { label: "Niche", placeholder: "ex. fitness, tests tech, cuisine" },
            audience: { label: "Audience", placeholder: "ex. débutants, créateurs, parents" },
            frequency: { label: "Fréquence de publication", placeholder: "ex. 2 vidéos/semaine" },
            experience: { label: "Niveau d'expérience", placeholder: "ex. débutant, intermédiaire, expert" },
          },
        },
        personalization: {
          title: "Personnalisation",
          subtitle: "Choisissez comment vous souhaitez nos communications.",
          emailFrequency: {
            label: "Fréquence des e-mails",
            hint: "Modifiable à tout moment dans les paramètres.",
            options: { daily: "Quotidienne", weekly: "Hebdomadaire", monthly: "Mensuelle", never: "Jamais" },
          },
        },
        complete: {
          title: "C'est prêt !",
          subtitle: "Vos préférences sont enregistrées. Redirection vers le tableau de bord…",
        },
      },
    },
  },
  pt: {
    layout: {
      nav: { onboarding: "Integração" },
      breadcrumb: { onboarding: "Integração" },
    },
    dashboard: {
      title: "Painel",
      subtitle: "Conecte seu canal do YouTube para ver estatísticas e sincronizar vídeos.",
    },
    landing: {
      meta: {
        title: "VidPulse — Kit gratuito para criadores do YouTube com IA",
        description:
          "Planeje, pesquise e publique vídeos melhores com um kit gratuito: ideias, fluxo de trabalho, concorrentes, calendário e análise de miniaturas.",
      },
      structuredData: {
        description: "Kit gratuito com IA para criadores do YouTube: ideias, planejamento e otimização.",
      },
      nav: {
        aria: "Navegação principal",
        features: "Recursos",
        pricing: "Preços",
        blog: "Blog",
        login: "Entrar",
      },
      cta: { getStartedFree: "Começar grátis" },
      hero: {
        kicker: "Publique vídeos melhores, mais rápido",
        title: "Seu kit de criador gratuito com IA",
        subtitle:
          "Das ideias ao calendário: o VidPulse ajuda você a planejar, otimizar e publicar com consistência—sem dez ferramentas.",
        primaryCta: "Começar grátis",
        secondaryCta: "Ver preços",
        mockAlt: "Prévia do painel VidPulse",
        bullets: { "0": "Grátis para começar", "1": "Feito para velocidade", "2": "Disponível em 9 idiomas" },
      },
    },
    onboarding: {
      title: "Bem-vindo ao VidPulse",
      subtitle: "Vamos configurar seu espaço de trabalho em poucos passos.",
      progress: {
        welcome: "Boas-vindas",
        connect: "Conectar YouTube",
        goals: "Metas",
        channel: "Info do canal",
        personalize: "Personalização",
        complete: "Concluído",
      },
      actions: { back: "Voltar", next: "Próximo", skip: "Pular", finish: "Concluir" },
      validation: {
        generic: "Verifique suas respostas e tente novamente.",
        goalsMinOne: "Selecione pelo menos uma meta ou adicione uma personalizada.",
        channelInfo: "Preencha todos os campos do canal (mínimo 2 caracteres cada).",
      },
      errors: {
        UNAUTHENTICATED: "Faça login para continuar a integração.",
        DB_ERROR: "Não foi possível salvar seu progresso. Tente novamente.",
        INVALID_STEP: "Etapa de integração inválida.",
      },
      steps: {
        welcome: {
          title: "Vamos começar",
          subtitle: "Isso ajuda o VidPulse a adaptar sugestões ao seu canal.",
          bullets: {
            youtube: "Conecte o YouTube para desbloquear análises e sincronização.",
            goals: "Escolha metas para otimizar seu fluxo de trabalho.",
            personalize: "Escolha notificações e frequência de e-mail.",
          },
        },
        connectYouTube: {
          title: "Conectar YouTube",
          subtitle: "Opcional, mas recomendado para desbloquear o painel.",
        },
        goals: {
          title: "Suas metas",
          subtitle: "Escolha pelo menos uma para personalizar recomendações.",
          options: {
            grow: "Aumentar inscritos e visualizações",
            consistent: "Publicar com mais consistência",
            monetize: "Monetizar o canal",
            workflow: "Melhorar fluxo de trabalho e planejamento",
          },
          custom: {
            label: "Meta personalizada (opcional)",
            placeholder: "ex. melhorar retenção nos primeiros 30 segundos",
            hint: "Se nenhuma opção servir, adicione a sua.",
          },
        },
        channelInfo: {
          title: "Informações do canal",
          subtitle: "Alguns detalhes nos ajudam a personalizar ideias e modelos.",
          fields: {
            niche: { label: "Nicho", placeholder: "ex. fitness, reviews de tech, culinária" },
            audience: { label: "Público", placeholder: "ex. iniciantes, criadores, pais" },
            frequency: { label: "Frequência de upload", placeholder: "ex. 2 vídeos/semana" },
            experience: { label: "Nível de experiência", placeholder: "ex. novo, intermediário, avançado" },
          },
        },
        personalization: {
          title: "Personalização",
          subtitle: "Escolha como deseja receber nossas comunicações.",
          emailFrequency: {
            label: "Frequência de e-mail",
            hint: "Você pode alterar isso a qualquer momento nas configurações.",
            options: { daily: "Diária", weekly: "Semanal", monthly: "Mensal", never: "Nunca" },
          },
        },
        complete: {
          title: "Tudo pronto!",
          subtitle: "Salvamos suas preferências. Redirecionando ao painel…",
        },
      },
    },
  },
  ru: {
    layout: {
      nav: { onboarding: "Настройка" },
      breadcrumb: { onboarding: "Настройка" },
    },
    dashboard: {
      title: "Панель",
      subtitle: "Подключите канал YouTube, чтобы видеть статистику и синхронизировать видео.",
    },
    landing: {
      meta: {
        title: "VidPulse — Бесплатный ИИ-набор для YouTube-авторов",
        description:
          "Планируйте, исследуйте и публикуйте лучшие видео с бесплатным набором: идеи, workflow, конкуренты, календарь и анализ превью.",
      },
      structuredData: {
        description: "Бесплатный ИИ-набор для YouTube-авторов: идеи, планирование и оптимизация.",
      },
      nav: {
        aria: "Основная навигация",
        features: "Возможности",
        pricing: "Цены",
        blog: "Блог",
        login: "Войти",
      },
      cta: { getStartedFree: "Начать бесплатно" },
      hero: {
        kicker: "Лучшие видео — быстрее",
        title: "Ваш бесплатный ИИ-набор для авторов",
        subtitle:
          "От идей до расписания: VidPulse помогает планировать, оптимизировать и публиковать регулярно—без десяти разных инструментов.",
        primaryCta: "Начать бесплатно",
        secondaryCta: "Смотреть цены",
        mockAlt: "Превью панели VidPulse",
        bullets: { "0": "Бесплатный старт", "1": "Создан для скорости", "2": "Доступен на 9 языках" },
      },
    },
    onboarding: {
      title: "Добро пожаловать в VidPulse",
      subtitle: "Настроим рабочее пространство за пару шагов.",
      progress: {
        welcome: "Приветствие",
        connect: "Подключить YouTube",
        goals: "Цели",
        channel: "О канале",
        personalize: "Персонализация",
        complete: "Готово",
      },
      actions: { back: "Назад", next: "Далее", skip: "Пропустить", finish: "Завершить" },
      validation: {
        generic: "Проверьте ответы и попробуйте снова.",
        goalsMinOne: "Выберите хотя бы одну цель или добавьте свою.",
        channelInfo: "Заполните все поля о канале (минимум 2 символа в каждом).",
      },
      errors: {
        UNAUTHENTICATED: "Войдите, чтобы продолжить настройку.",
        DB_ERROR: "Не удалось сохранить прогресс. Попробуйте снова.",
        INVALID_STEP: "Недопустимый шаг настройки.",
      },
      steps: {
        welcome: {
          title: "Начнём настройку",
          subtitle: "Это поможет VidPulse подстроить рекомендации под ваш канал.",
          bullets: {
            youtube: "Подключите YouTube для аналитики и синхронизации.",
            goals: "Выберите цели для оптимизации workflow.",
            personalize: "Выберите уведомления и частоту писем.",
          },
        },
        connectYouTube: {
          title: "Подключить YouTube",
          subtitle: "Необязательно, но рекомендуется для панели.",
        },
        goals: {
          title: "Ваши цели",
          subtitle: "Выберите хотя бы одну для персональных рекомендаций.",
          options: {
            grow: "Рост подписчиков и просмотров",
            consistent: "Публиковать чаще и стабильнее",
            monetize: "Монетизировать канал",
            workflow: "Улучшить workflow и планирование",
          },
          custom: {
            label: "Своя цель (необязательно)",
            placeholder: "напр. улучшить удержание в первые 30 секунд",
            hint: "Если ни один вариант не подходит, добавьте свой.",
          },
        },
        channelInfo: {
          title: "Информация о канале",
          subtitle: "Несколько деталей помогут персонализировать идеи и шаблоны.",
          fields: {
            niche: { label: "Ниша", placeholder: "напр. фитнес, обзоры tech, кулинария" },
            audience: { label: "Аудитория", placeholder: "напр. новички, авторы, родители" },
            frequency: { label: "Частота публикаций", placeholder: "напр. 2 видео/неделю" },
            experience: { label: "Уровень опыта", placeholder: "напр. новичок, средний, профи" },
          },
        },
        personalization: {
          title: "Персонализация",
          subtitle: "Выберите, как получать от нас новости.",
          emailFrequency: {
            label: "Частота писем",
            hint: "Можно изменить в настройках в любое время.",
            options: { daily: "Ежедневно", weekly: "Еженедельно", monthly: "Ежемесячно", never: "Никогда" },
          },
        },
        complete: {
          title: "Всё готово!",
          subtitle: "Настройки сохранены. Перенаправляем на панель…",
        },
      },
    },
  },
  ja: {
    layout: {
      nav: { onboarding: "オンボーディング" },
      breadcrumb: { onboarding: "オンボーディング" },
    },
    dashboard: {
      title: "ダッシュボード",
      subtitle: "YouTubeチャンネルを接続して統計を表示し、動画を同期します。",
    },
    landing: {
      meta: {
        title: "VidPulse — 無料のAI YouTubeクリエイターツールキット",
        description:
          "無料ツールで動画を企画・調査・公開：アイデア生成、ワークフロー、競合追跡、スケジュール、サムネイル分析。",
      },
      structuredData: {
        description: "YouTubeクリエイター向け無料AIツールキット：アイデア、計画、最適化。",
      },
      nav: {
        aria: "メインナビゲーション",
        features: "機能",
        pricing: "料金",
        blog: "ブログ",
        login: "ログイン",
      },
      cta: { getStartedFree: "無料で始める" },
      hero: {
        kicker: "より良い動画を、より速く",
        title: "無料のAIクリエイターツールキット",
        subtitle:
          "アイデアからスケジュールまで：VidPulseは計画・最適化・継続的な公開を支援—10個のツールは不要です。",
        primaryCta: "無料で始める",
        secondaryCta: "料金を見る",
        mockAlt: "VidPulseダッシュボードのプレビュー",
        bullets: { "0": "無料で開始", "1": "スピード重視", "2": "9言語対応" },
      },
    },
    onboarding: {
      title: "VidPulseへようこそ",
      subtitle: "数ステップでワークスペースを設定しましょう。",
      progress: {
        welcome: "ようこそ",
        connect: "YouTube接続",
        goals: "目標",
        channel: "チャンネル情報",
        personalize: "パーソナライズ",
        complete: "完了",
      },
      actions: { back: "戻る", next: "次へ", skip: "スキップ", finish: "完了" },
      validation: {
        generic: "回答を確認してもう一度お試しください。",
        goalsMinOne: "目標を1つ以上選択するか、カスタム目標を追加してください。",
        channelInfo: "チャンネル情報の全フィールドを入力してください（各2文字以上）。",
      },
      errors: {
        UNAUTHENTICATED: "オンボーディングを続けるにはログインしてください。",
        DB_ERROR: "進捗を保存できませんでした。もう一度お試しください。",
        INVALID_STEP: "無効なオンボーディングステップです。",
      },
      steps: {
        welcome: {
          title: "セットアップを始めましょう",
          subtitle: "チャンネルに合わせた提案のために役立ちます。",
          bullets: {
            youtube: "YouTubeを接続して分析と同期を有効にします。",
            goals: "ワークフロー最適化のための目標を選びます。",
            personalize: "通知とメール頻度を選択します。",
          },
        },
        connectYouTube: {
          title: "YouTubeを接続",
          subtitle: "任意ですが、ダッシュボードの利用に推奨されます。",
        },
        goals: {
          title: "あなたの目標",
          subtitle: "おすすめをパーソナライズするため1つ以上選択してください。",
          options: {
            grow: "登録者と視聴回数を増やす",
            consistent: "より継続的に公開する",
            monetize: "チャンネルを収益化する",
            workflow: "ワークフローと計画を改善する",
          },
          custom: {
            label: "カスタム目標（任意）",
            placeholder: "例：最初の30秒の維持率を改善",
            hint: "該当がなければ独自の目標を追加してください。",
          },
        },
        channelInfo: {
          title: "チャンネル情報",
          subtitle: "いくつかの詳細でアイデアとテンプレートを最適化します。",
          fields: {
            niche: { label: "ニッチ", placeholder: "例：フィットネス、テックレビュー、料理" },
            audience: { label: "視聴者", placeholder: "例：初心者、クリエイター、親" },
            frequency: { label: "投稿頻度", placeholder: "例：週2本" },
            experience: { label: "経験レベル", placeholder: "例：初心者、中級、上級" },
          },
        },
        personalization: {
          title: "パーソナライズ",
          subtitle: "連絡方法を選択してください。",
          emailFrequency: {
            label: "メール頻度",
            hint: "設定でいつでも変更できます。",
            options: { daily: "毎日", weekly: "毎週", monthly: "毎月", never: "受け取らない" },
          },
        },
        complete: {
          title: "設定完了！",
          subtitle: "設定を保存しました。ダッシュボードに移動します…",
        },
      },
    },
  },
  zh: {
    layout: {
      nav: { onboarding: "入门引导" },
      breadcrumb: { onboarding: "入门引导" },
    },
    dashboard: {
      title: "仪表盘",
      subtitle: "连接你的 YouTube 频道以查看统计数据并同步视频。",
    },
    landing: {
      meta: {
        title: "VidPulse — 免费 AI YouTube 创作者工具包",
        description: "用免费工具规划、研究并发布更好的视频：创意生成、工作流、竞品追踪、排期和缩略图分析。",
      },
      structuredData: {
        description: "面向 YouTube 创作者的免费 AI 工具包：创意、规划与优化。",
      },
      nav: {
        aria: "主导航",
        features: "功能",
        pricing: "定价",
        blog: "博客",
        login: "登录",
      },
      cta: { getStartedFree: "免费开始" },
      hero: {
        kicker: "更快发布更好的视频",
        title: "你的免费 AI 创作者工具包",
        subtitle: "从创意到排期：VidPulse 帮助你规划、优化并持续发布——无需十个工具。",
        primaryCta: "免费开始",
        secondaryCta: "查看定价",
        mockAlt: "VidPulse 仪表盘预览",
        bullets: { "0": "免费起步", "1": "为速度而生", "2": "支持 9 种语言" },
      },
    },
    onboarding: {
      title: "欢迎使用 VidPulse",
      subtitle: "只需几步即可设置你的工作区。",
      progress: {
        welcome: "欢迎",
        connect: "连接 YouTube",
        goals: "目标",
        channel: "频道信息",
        personalize: "个性化",
        complete: "完成",
      },
      actions: { back: "返回", next: "下一步", skip: "跳过", finish: "完成" },
      validation: {
        generic: "请检查你的回答后重试。",
        goalsMinOne: "请至少选择一个目标或添加自定义目标。",
        channelInfo: "请填写所有频道信息字段（每项至少 2 个字符）。",
      },
      errors: {
        UNAUTHENTICATED: "请登录以继续入门引导。",
        DB_ERROR: "无法保存进度，请重试。",
        INVALID_STEP: "无效的入门步骤。",
      },
      steps: {
        welcome: {
          title: "开始设置",
          subtitle: "这有助于 VidPulse 根据你的频道定制建议。",
          bullets: {
            youtube: "连接 YouTube 以解锁分析与同步。",
            goals: "选择目标以优化你的工作流。",
            personalize: "选择通知和邮件频率。",
          },
        },
        connectYouTube: {
          title: "连接 YouTube",
          subtitle: "可选，但建议连接以解锁仪表盘。",
        },
        goals: {
          title: "你的目标",
          subtitle: "请至少选择一项以个性化推荐。",
          options: {
            grow: "增长订阅者与播放量",
            consistent: "更稳定地发布",
            monetize: "频道变现",
            workflow: "改进工作流与规划",
          },
          custom: {
            label: "自定义目标（可选）",
            placeholder: "例如：提升前 30 秒留存",
            hint: "如果没有合适选项，请添加自己的目标。",
          },
        },
        channelInfo: {
          title: "频道信息",
          subtitle: "一些细节有助于定制创意和模板。",
          fields: {
            niche: { label: "领域", placeholder: "例如：健身、科技评测、烹饪" },
            audience: { label: "受众", placeholder: "例如：新手、创作者、家长" },
            frequency: { label: "发布频率", placeholder: "例如：每周 2 个视频" },
            experience: { label: "经验水平", placeholder: "例如：新手、中级、专业" },
          },
        },
        personalization: {
          title: "个性化",
          subtitle: "选择你希望如何收到我们的消息。",
          emailFrequency: {
            label: "邮件频率",
            hint: "可随时在设置中更改。",
            options: { daily: "每天", weekly: "每周", monthly: "每月", never: "从不" },
          },
        },
        complete: {
          title: "全部完成！",
          subtitle: "已保存你的偏好，正在跳转到仪表盘…",
        },
      },
    },
  },
};

for (const locale of Object.keys(patches)) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  const current = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const merged = deepMerge(current, patches[locale]);
  fs.writeFileSync(filePath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log(`Translated UI strings in ${locale}.json`);
}
