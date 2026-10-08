/** Edit the homepage's copy, featured links, and artwork here. */
export type HomeCard = {
  title: string;
  byline: string;
  date: string;
  label: string;
  href: string;
  image: string;
  alt: string;
};

export const homeCopy = {
  heroLines: ["Following Jesus.", "Exploring faith.", "Living it out."],
  intro: "Thoughtful conversations and essays from an Anabaptist perspective. Rooted in Scripture. Centered on Jesus. Lived in community.",
  conversationEyebrow: "Ideas worth sitting with",
  conversationHeading: "More conversations.",
  missionEyebrow: "Our shared calling",
  missionLines: ["A faith to be lived.", "A kingdom to serve."],
  missionQuestion: "What does following Jesus look like in everyday life?",
  missionText: "We explore that question through honest conversations, biblical teaching, and stories from the Anabaptist community. Our purpose is to encourage allegiance to Jesus’ sacrificial kingdom.",
  topicsEyebrow: "Explore the questions that matter",
  topicsHeading: "Find your next perspective.",
  essaysEyebrow: "Essays for King Jesus",
  essaysHeading: "Read. Reflect. Put it into practice.",
  newsletterHeading: "A little perspective in your inbox.",
  newsletterText: "New conversations, thoughtful essays, and news from our work.",
  newsletterHref: "https://secure.lglforms.com/form_engine/s/IVQ4KbDjzbVOyKXzgibb7A",
};

export const featuredEpisode = {
  title: "For 37 Years, I Thought My Church Made Me a Christian. It Didn’t.",
  label: "Episode 338",
  href: "/episodes/for-37-years-i-thought-my-church-made-me-a-christian-it-didnt/",
  image: "https://media.anabaptistperspectives.org/26RB01-Youtube.jpg",
  imageAlt: "Raymond Burkholder, featured interview",
  videoId: "nmbyBDYf_EM",
};

export const conversations: HomeCard[] = [
  {
    title: "Evolutionary Biology PhD, But Also Young Earth Creationist. Here’s Why.",
    byline: "Todd Wood",
    date: "2026-09-17",
    label: "Episode 337",
    href: "/episodes/evolutionary-biology-phd-but-also-young-earth-creationist-heres-why/",
    image: "https://media.anabaptistperspectives.org/26TW01-Youtube-768x432.jpg",
    alt: "Evolutionary Biology PhD, But Also Young Earth Creationist. Here’s Why.",
  },
  {
    title: "How Radical Islam Caused 9/11: Returning to the Sources and Bin Laden",
    byline: "Chris Stoltzfus",
    date: "2026-09-10",
    label: "Episode 336",
    href: "/episodes/how-radical-islam-caused-9-11-returning-to-the-sources-and-bin-laden/",
    image: "https://media.anabaptistperspectives.org/26CS03-768x432.jpg",
    alt: "How Radical Islam Caused 9/11: Returning to the Sources and Bin Laden",
  },
  {
    title: "The Theologian of Early Anabaptism Who Died for Politics",
    byline: "Dean Taylor",
    date: "2026-09-03",
    label: "Episode 335",
    href: "/episodes/the-theologian-of-early-anabaptism-who-died-for-politics/",
    image: "https://media.anabaptistperspectives.org/26DT01-768x432.jpg",
    alt: "The Theologian of Early Anabaptism Who Died for Politics",
  },
];

export const essays: HomeCard[] = [
  {
    title: "How Can “Anabaptism” Fulfill Its Destiny to Become Just Plain “Christianity”?",
    byline: "Reed Merino",
    date: "2026-08-22",
    label: "Essay",
    href: "/essays/how-can-anabaptism-fulfill-its-destiny-to-become-just-plain-christianity/",
    image: "https://media.anabaptistperspectives.org/Essay-Podcast-Cover-3-768x768.png",
    alt: "How Can “Anabaptism” Fulfill Its Destiny to Become Just Plain “Christianity”?",
  },
  {
    title: "All Christians Speak in Church: What Does This Mean for Sisters?",
    byline: "Marlin Sommers",
    date: "2026-05-02",
    label: "Essay",
    href: "/essays/all-christians-speak-in-church-what-does-this-mean-for-sisters/",
    image: "https://media.anabaptistperspectives.org/Essay-Podcast-Cover-768x768.jpg",
    alt: "All Christians Speak in Church: What Does This Mean for Sisters?",
  },
  {
    title: "Peter Eby – The Great Swiss-American Anabaptist Elder of Pequea",
    byline: "Merle Weaver",
    date: "2026-01-10",
    label: "Essay",
    href: "/essays/peter-eby-the-great-swiss-american-anabaptist-elder-of-pequea/",
    image: "https://media.anabaptistperspectives.org/Peter-Eby-Landscape-768x433.png",
    alt: "Peter Eby – The Great Swiss-American Anabaptist Elder of Pequea",
  },
];

export const collections = [
  { title: "Christian Living", text: "Following Jesus in the everyday.", count: "74 resources", href: "/category/christian-living/", image: "https://media.anabaptistperspectives.org/Is-Convenience-Really-the-Goal-768x432.jpg" },
  { title: "Theology", text: "Think deeply about what we believe.", count: "103 resources", href: "/category/theology/", image: "https://media.anabaptistperspectives.org/YT-thumbnail-768x432.png" },
  { title: "History", text: "Meet the people who shaped our faith.", count: "60 resources", href: "/category/history/", image: "https://media.anabaptistperspectives.org/26CK01-YoutTube-768x432.jpg" },
  { title: "Missions & Evangelism", text: "Sharing the gospel. Serving our neighbors.", count: "59 resources", href: "/category/missions-evangelism/", image: "https://media.anabaptistperspectives.org/26JF01-768x432.jpg" },
  { title: "Testimony & Life", text: "Real stories of faith and transformation.", count: "10 resources", href: "/category/testimony-and-life-experience/", image: "https://media.anabaptistperspectives.org/An-Atheist-Behind-the-Iron-Curtain-768x432.jpg" },
  { title: "War & Peace", text: "Explore nonresistance and the way of Jesus.", count: "48 resources", href: "/tag/war/", image: "https://media.anabaptistperspectives.org/1-1-768x432.jpg" },
];

export const platforms = [
  { name: "YouTube", label: "Watch Anabaptist Perspectives on YouTube", href: "https://www.youtube.com/anabaptistperspectives", image: "/assets/platforms/youtube.svg", width: 120, height: 28, imageClass: "w-[120px] max-[700px]:w-[112px]" },
  { name: "Spotify", label: "Listen to Anabaptist Perspectives on Spotify", href: "https://open.spotify.com/show/5ioq20ieTtePlADvRVNEiO", image: "/assets/platforms/spotify.png", width: 116, height: 35, imageClass: "w-[116px] max-[700px]:w-[110px]" },
  { name: "Apple Podcasts", label: "Listen to Anabaptist Perspectives on Apple Podcasts", href: "https://podcasts.apple.com/us/podcast/anabaptist-perspectives/id1328156915", image: "/assets/platforms/apple-podcasts.svg", width: 132, height: 48, imageClass: "w-[132px] max-[700px]:w-[128px]" },
  { name: "Telegram", label: "Follow Anabaptist Perspectives on Telegram", href: "https://t.me/AnabaptistPerspectives", image: "/assets/platforms/telegram.svg", width: 30, height: 30, imageClass: "w-[30px]", showName: true },
];
