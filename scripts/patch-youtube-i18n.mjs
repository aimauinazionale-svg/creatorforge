import fs from "fs";
import path from "path";

const dir = "messages";
const locales = ["en", "it", "es", "de", "fr", "pt", "ru", "ja", "zh"];

const youtubePatches = {
  en: {
    NOT_CONFIGURED: "Configure YOUTUBE_API_KEY in your environment to connect channels.",
    INVALID_URL: "That doesn't look like a valid YouTube channel URL or handle.",
    invalidUrl: "That doesn't look like a valid YouTube channel URL or handle.",
    CHANNEL_NOT_FOUND: "We couldn't find a YouTube channel for that URL or handle.",
    fields: {
      channelUrl: {
        label: "Channel URL or @handle",
        placeholder: "@yourchannel or https://www.youtube.com/@yourchannel",
        hint: "Supports youtube.com/channel/UC…, /c/name, /user/name, or @handle.",
      },
    },
  },
  it: {
    NOT_CONFIGURED: "Configura YOUTUBE_API_KEY nell'ambiente per collegare i canali.",
    INVALID_URL: "URL o handle del canale YouTube non valido.",
    invalidUrl: "URL o handle del canale YouTube non valido.",
    CHANNEL_NOT_FOUND: "Nessun canale YouTube trovato per questo URL o handle.",
    fields: {
      channelUrl: {
        label: "URL canale o @handle",
        placeholder: "@tuocanale o https://www.youtube.com/@tuocanale",
        hint: "Supporta youtube.com/channel/UC…, /c/nome, /user/nome o @handle.",
      },
    },
    commonDbError: "Non siamo riusciti a salvare le modifiche. {details}",
  },
  es: {
    NOT_CONFIGURED: "Configura YOUTUBE_API_KEY en el entorno para conectar canales.",
    INVALID_URL: "URL o identificador del canal de YouTube no válido.",
    invalidUrl: "URL o identificador del canal de YouTube no válido.",
    CHANNEL_NOT_FOUND: "No encontramos un canal de YouTube para esa URL o identificador.",
    fields: {
      channelUrl: {
        label: "URL del canal o @identificador",
        placeholder: "@tucanal o https://www.youtube.com/@tucanal",
        hint: "Admite youtube.com/channel/UC…, /c/nombre, /user/nombre o @identificador.",
      },
    },
    commonDbError: "No pudimos guardar los cambios. {details}",
  },
  de: {
    NOT_CONFIGURED: "Konfiguriere YOUTUBE_API_KEY in der Umgebung, um Kanäle zu verbinden.",
    INVALID_URL: "Ungültige YouTube-Kanal-URL oder Handle.",
    invalidUrl: "Ungültige YouTube-Kanal-URL oder Handle.",
    CHANNEL_NOT_FOUND: "Für diese URL oder dieses Handle wurde kein YouTube-Kanal gefunden.",
    fields: {
      channelUrl: {
        label: "Kanal-URL oder @Handle",
        placeholder: "@deinkanal oder https://www.youtube.com/@deinkanal",
        hint: "Unterstützt youtube.com/channel/UC…, /c/name, /user/name oder @Handle.",
      },
    },
    commonDbError: "Wir konnten deine Änderungen nicht speichern. {details}",
  },
  fr: {
    NOT_CONFIGURED:
      "Configurez YOUTUBE_API_KEY dans votre environnement pour connecter des chaînes.",
    INVALID_URL: "URL ou identifiant de chaîne YouTube invalide.",
    invalidUrl: "URL ou identifiant de chaîne YouTube invalide.",
    CHANNEL_NOT_FOUND: "Aucune chaîne YouTube trouvée pour cette URL ou cet identifiant.",
    fields: {
      channelUrl: {
        label: "URL de chaîne ou @identifiant",
        placeholder: "@votrechaine ou https://www.youtube.com/@votrechaine",
        hint: "Prend en charge youtube.com/channel/UC…, /c/nom, /user/nom ou @identifiant.",
      },
    },
    commonDbError: "Nous n'avons pas pu enregistrer vos modifications. {details}",
  },
  pt: {
    NOT_CONFIGURED: "Configure YOUTUBE_API_KEY no ambiente para conectar canais.",
    INVALID_URL: "URL ou identificador do canal do YouTube inválido.",
    invalidUrl: "URL ou identificador do canal do YouTube inválido.",
    CHANNEL_NOT_FOUND: "Não encontramos um canal do YouTube para essa URL ou identificador.",
    fields: {
      channelUrl: {
        label: "URL do canal ou @identificador",
        placeholder: "@seucanal ou https://www.youtube.com/@seucanal",
        hint: "Suporta youtube.com/channel/UC…, /c/nome, /user/nome ou @identificador.",
      },
    },
    commonDbError: "Não foi possível salvar suas alterações. {details}",
  },
  ru: {
    NOT_CONFIGURED: "Настройте YOUTUBE_API_KEY в окружении для подключения каналов.",
    INVALID_URL: "Недействительный URL канала YouTube или идентификатор.",
    invalidUrl: "Недействительный URL канала YouTube или идентификатор.",
    CHANNEL_NOT_FOUND: "Канал YouTube для этого URL или идентификатора не найден.",
    fields: {
      channelUrl: {
        label: "URL канала или @идентификатор",
        placeholder: "@вашканал или https://www.youtube.com/@вашканал",
        hint: "Поддерживает youtube.com/channel/UC…, /c/имя, /user/имя или @идентификатор.",
      },
    },
    commonDbError: "Не удалось сохранить изменения. {details}",
  },
  ja: {
    NOT_CONFIGURED: "チャンネルを接続するには環境変数 YOUTUBE_API_KEY を設定してください。",
    INVALID_URL: "有効な YouTube チャンネル URL またはハンドルではありません。",
    invalidUrl: "有効な YouTube チャンネル URL またはハンドルではありません。",
    CHANNEL_NOT_FOUND:
      "その URL またはハンドルに一致する YouTube チャンネルが見つかりませんでした。",
    fields: {
      channelUrl: {
        label: "チャンネル URL または @ハンドル",
        placeholder: "@yourchannel または https://www.youtube.com/@yourchannel",
        hint: "youtube.com/channel/UC…、/c/name、/user/name、@ハンドルに対応。",
      },
    },
    commonDbError: "変更を保存できませんでした。{details}",
  },
  zh: {
    NOT_CONFIGURED: "请在环境中配置 YOUTUBE_API_KEY 以连接频道。",
    INVALID_URL: "无效的 YouTube 频道 URL 或句柄。",
    invalidUrl: "无效的 YouTube 频道 URL 或句柄。",
    CHANNEL_NOT_FOUND: "找不到与该 URL 或句柄对应的 YouTube 频道。",
    fields: {
      channelUrl: {
        label: "频道 URL 或 @句柄",
        placeholder: "@yourchannel 或 https://www.youtube.com/@yourchannel",
        hint: "支持 youtube.com/channel/UC…、/c/name、/user/name 或 @句柄。",
      },
    },
    commonDbError: "无法保存更改。{details}",
  },
};

for (const locale of locales) {
  const file = path.join(dir, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const patch = youtubePatches[locale];
  if (!data.youtube) continue;

  data.youtube.errors = {
    ...data.youtube.errors,
    NOT_CONFIGURED: patch.NOT_CONFIGURED,
    INVALID_URL: patch.INVALID_URL,
    invalidUrl: patch.invalidUrl,
    CHANNEL_NOT_FOUND: patch.CHANNEL_NOT_FOUND,
  };
  data.youtube.fields = patch.fields;

  if (patch.commonDbError && data.common?.errors) {
    data.common.errors.DB_ERROR = patch.commonDbError;
  }

  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  console.log("patched", locale);
}
