import Link from 'next/link';

/**
 * 首页服务端渲染正文（SEO）：不依赖 JS，放在交互区下方。
 * FAQ 同时用于可见文本与 FAQPage JSON-LD，保证两者一致。
 */
export const HOME_FAQ = [
  {
    question: '你的话语要付费或注册吗？',
    answer: '完全免费，不需要注册账号。收藏、背诵进度与笔记都保存在你自己的浏览器里。',
  },
  {
    question: '用的是哪个圣经译本？',
    answer: '中文经文采用和合本，可切换繁体或简体；英文经文采用 World English Bible（WEB）。',
  },
  {
    question: '怎样把要背的经文分享给小组？',
    answer: '在深度背诵里选好经文后点「生成背诵链接」，就能用链接或二维码分享，对方打开即可一起背。',
  },
  {
    question: '手机上可以使用吗？',
    answer: '可以。网站针对手机设计，也能加入主屏幕，像 App 一样随时打开背经文。',
  },
] as const;

const features = [
  {
    title: '拼音、中文、英文查经',
    body: '输入拼音首字母、中文关键字或英文，就能秒查和合本经文，不必记得确切的书卷章节。',
  },
  {
    title: 'Flash Card 逐节背诵',
    body: '用卡片翻转复习经文；深度背诵分四个阶段逐步遮盖文字，最后按拼音首字母默写，真正把经文藏在心里。',
  },
  {
    title: '圣经笔记本',
    body: '一边读经一边写灵修笔记，引用经文自动带出原文，适合个人灵修与小组查经整理。',
  },
] as const;

const steps = [
  '用拼音、中文或英文搜索想背的经文。',
  '点星号把经文加入「我的收藏」。',
  '进入深度背诵，按四个阶段逐节记忆。',
  '生成背诵链接或卡片，和朋友一起背。',
] as const;

export function homeFaqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOME_FAQ.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}

export default function HomeSeoContent() {
  return (
    <section
      aria-labelledby="home-intro-title"
      className="relative z-10 border-t border-stone-900/10 bg-[#f8f5ee] px-4 py-14 text-stone-800 dark:border-white/10 dark:bg-[#0e1116] dark:text-stone-200"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqJsonLd()) }} />
      <div className="mx-auto max-w-3xl space-y-10 leading-7">
        <div>
          <h1
            id="home-intro-title"
            className="text-2xl font-semibold tracking-[0.04em] text-stone-950 dark:text-stone-50"
          >
            免费在线背圣经：查经、背经、写灵修笔记
          </h1>
          <p className="mt-3">
            你的话语是一个免费的圣经背诵工具。用拼音、中文或英文秒查和合本经文，以 Flash Card 和四阶段深度背诵逐节记忆，
            再把喜欢的经文收藏、分享给朋友，或写成灵修笔记。不用下载、不用注册，打开网页就能开始。
          </p>
          <Link
            href="/memorize"
            className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-stone-950 px-5 text-sm font-medium text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-white"
          >
            开始背经文
          </Link>
        </div>

        {features.map(({ title, body }) => (
          <div key={title}>
            <h2 className="text-xl font-semibold text-stone-950 dark:text-stone-50">{title}</h2>
            <p className="mt-2">{body}</p>
          </div>
        ))}

        <div>
          <h2 className="text-xl font-semibold text-stone-950 dark:text-stone-50">四步开始背经文</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-6">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-stone-950 dark:text-stone-50">常见问题</h2>
          {HOME_FAQ.map(({ question, answer }) => (
            <div key={question} className="mt-4">
              <h3 className="font-semibold text-stone-950 dark:text-stone-50">{question}</h3>
              <p className="mt-1">{answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
