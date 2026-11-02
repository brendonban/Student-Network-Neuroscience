// Starter content for the leads area, copied from the Notion "SNN - Leads Coordination" pages.
// Used once by the "Create pages" button. After that, everything is edited on the site.

const TODO = "*Content still to be moved over from Notion.*";

export const SEED = [
  {
    id: "home", parent: null, emoji: "🧠", title: "SNN - Leads Coordination", order: 0,
    content: `[subpages]

---

# Ideas and Discussion Topics
Leave your spontaneous ideas etc here as a toggle, so people can pick them up in the future, and actually make it happen!
If you have any opinions/thoughts/additions on the points others have written, feel free add them as points within each toggle!

***If you want to discuss any of the things you see here, put it on the Agenda for the next Team Call!***

+ In Person Leads Meeting
+ Become independent of PsyFaKo
+ Make some stickers / flyers?
+ Neuro Quiz on Social Media (weekly)
+ Some sort of support for students trying to publish their work

> There is also a page with projects that we have started working on but have abandoned for various reasons. Some of them still have the potential to be picked up again or could serve as inspiration for other projects in the future.
> → [[sad-lonely]]

---

# Task Group Assignments GP44
Please assign yourself to the different areas of work, where you'd like to contribute to for the current fiscal period (roughly until mid October/November)!
Add yourself to as many as you want, but make sure you don't go overboard : )
The available task groups are based on what had been discussed in the Team Call on the 23.05. as well as regular ongoing tasks that need to be taken care of.

If you are unsure what the 3 different levels indicate, please ask in the leads general group/channel on WA or Discord.
This table is complementary to the Capacity List below.

| Task Group | Page | Short Description | Responsible | Actively Involved |
|---|---|---|---|---|
| Neuro Talk Evenings | [[p-nte]] | Organising NTEs, Advertisement, Editing Videos etc | Jana | Emi De, Berry N, Phil Tögel, SebastianW.UOS, Lara Uysal |
| Neuro Hands-On/Workshops | [[p-handson]] | Organising Workshops, Hackathons and similar learning opportunities. | Phil Tögel | Brendon, Berry N, Phil Tögel, SebastianW.UOS, Jana |
| Neuro Students Conference 2026 / 2027 | [[p-conf-2026]] | Organisation of our yearly conference - 2026/2027 is somewhat merged, as in 2027 we intend to move the date to an earlier time & do it in person (linked the 2026 page, there already is a 2027 one as well) | Melissa | Asuka Kähler, Brendon, Rebeka Kalinova, Emi De, Julinski G, Maya, Kayla Zornhagen |
| Social Media + Newsletter | [[outreach]] | posting; creating posts (unless they are project specific, then ideally ppl from that project create them); answering messages etc | Amé | Marco Stiegelbauer, Julinski G, Lara Uysal, Patryk M, Clara, Rena Mizuno |
| Website | [[website]] | upkeep of the current website. Re-design / Setting up a new one would be nice, | Brendon | Patryk M, Asuka Kähler |
| Internal Management | [[network-management]] | Proper Documentation of all Workflows & Resources; Guides to organize events; Update outdated things; add needed explanations; get rid of old documents etc. + Notion & Drive clean-up. Organization of the internal Team structure and Onboardings. | Asuka Kähler | Rebeka Kalinova, Marco Stiegelbauer, Larissa Marie Nelle |
| Mentoring Program | [[p-mentoring]] | Developing and starting the first run of our Mentoring program with the DGPA! | Kayla Zornhagen | Clara |
| Science Communication Content (incl. Paper of the Week) | [[p-scicomm]] | Social Media project for ...well... Science Communication | Julinski G | Rebeka Kalinova, Melissa, Jana, Larissa Marie Nelle |
| Fields of Neuroscience |  | Social media series with presenting fields of neuroscience (e.g., career perspectives) - No subpage yet as there has only been little work done | Marco Stiegelbauer | Patryk M, Clara |
| Coordination / Representative Work |  | majority of mails; communication with PsyFaKo & external groups; Network SignUps; Management of the Discord Server and WhatsApp Community (elected position; don't add yourself in this row) |  |  |
| Members on Hiatus |  |  |  | annette.hrm |
`,
  },

  { id: "readme", parent: "home", group: "Don’t dare to skip 😱", emoji: "‼️", title: "READ ME (please, it’s important)", order: 1, content: TODO },
  { id: "how-to", parent: "home", group: "How-To Pages", emoji: "📄", title: "How - To Pages", order: 2, content: TODO },

  {
    id: "projects-events", parent: "home", group: "Where all the good stuff happens (^-^)", emoji: "📄", title: "Projects & Events", order: 3,
    content: `[toc]

# Info
On this page all current and upcoming projects / events are listed, as well as some abandoned projects that could be picked up again.

The subpages you will find below differ in their content & structure, as they function as workspaces for the people working on the respective project.

The Gallery contains all current running Projects. If you scroll below, you will find a page called “Sad and Lonely Projects” - this one contains projects that have been started in the past, but have never been finished for a variety of reasons - some of them could be picked up again, or at least the basic idea behind them could be used for a novel project - feel free to check them out.
At the very bottom of this page you will also find subpages from past projects that have been finished successfully - they are mainly kept for documentation reasons, but if you intend to start a similar project it might be worth checking them out beforehand.

[gallery: Current]

# Up for Adoption - Abandoned Projects / Project Ideas
[list: Up for Adoption]

# Past Projects / Events
[list: Past]
`,
  },
  { id: "p-nte", parent: "projects-events", group: "Current", emoji: "🎤", title: "Neuro Talk Evenings", order: 1, content: TODO },
  { id: "p-conf-2026", parent: "projects-events", group: "Current", emoji: "🎓", title: "2026 Neuro Students Conference", order: 2, content: TODO },
  { id: "p-scicomm", parent: "projects-events", group: "Current", emoji: "🔬", title: "Science Communication", order: 3, content: TODO },
  { id: "p-conf-2027", parent: "projects-events", group: "Current", emoji: "🎓", title: "2027 Neuro Students Conference", order: 4, content: TODO },
  { id: "p-mentoring", parent: "projects-events", group: "Current", emoji: "🤝", title: "Mentoring Program", order: 5, content: TODO },
  { id: "p-handson", parent: "projects-events", group: "Current", emoji: "🧪", title: "Neuro Hands-On", order: 6, content: TODO },
  { id: "p-mbb", parent: "projects-events", group: "Current", emoji: "🙋", title: "Volunteer Slots: 14th MBB Symposium", order: 7, content: TODO },
  { id: "sad-lonely", parent: "projects-events", group: "Up for Adoption", emoji: "🥺", title: "Sad and Lonely Projects :(", order: 50, content: TODO },

  {
    id: "outreach", parent: "home", group: "Where all the good stuff happens (^-^)", emoji: "📄", title: "Outreach and Networking", order: 4,
    content: `[toc]

# Introduction
This page is handling everything that is related to public (in a broader sense, as we count Network Internal Communication as public as well) communication!

**Headings with a ‘#’ in front of them refer to specific channels on Discord!**

# Designs and Templates
${TODO}

# #outreach_networking

## General Concepts & Rules applying to both Social Media & Newsletters/Announcements

### Calls
${TODO}

### Responsibilities
${TODO}

### #feedback_posts
${TODO}

### Adaption of Content
${TODO}

### Post Timing & Designs
${TODO}

### Social Media
${TODO}

### Newsletter & Announcements
${TODO}
`,
  },
  { id: "network-management", parent: "home", group: "Where all the good stuff happens (^-^)", emoji: "📄", title: "Network Management", order: 5, content: TODO },
  { id: "website", parent: "home", group: "Where all the good stuff happens (^-^)", emoji: "📄", title: "Website", order: 6, content: TODO },
  { id: "unassigned-todos", parent: "home", group: "Other", emoji: "📄", title: "Unassigned To-Dos", order: 7, content: TODO },
];
