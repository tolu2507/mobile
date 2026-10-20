# BrainBox Mobile

The BrainBox app for **children**, **parents** and **tuck-shop staff**, on Android and on the web (Expo web). School
staff and the Overwatch team use the web dashboard (`../frontend`). Everything talks to the API in `../backend`.

Android package `com.tolulopeb.brainbox`, deep-link scheme `brainbox://` (Squad sends parents back with
`brainbox://payment`).

## Stack

| Concern | Choice |
|---|---|
| Framework | Expo SDK 57, Expo Router (file-based routes in `src/app`) |
| Styling | Tailwind via **NativeWind 4** (`className="..."`) |
| Server data | **TanStack Query** (`src/features/*/api.ts`) |
| App state | **Zustand** (`src/store`, `src/features/student/stickerReplay.ts`), persisted with MMKV |
| HTTP | **axios** with auth + token-refresh interceptors (`src/lib/api.ts`) |
| Forms | **react-hook-form** + **zod** (`src/components/form`, shared rules in `src/lib/validation.ts`) |
| Animated components | **Reacticx**, copied into `src/components/reacticx` |
| Motion, haptics, sound | Reanimated 4, Gesture Handler, expo-haptics, expo-audio (effects), expo-speech (nursery voice) |
| Fonts | Bricolage Grotesque (headings, numbers) + Figtree (text) |

## Getting started

```bash
cp .env.example .env      # EXPO_PUBLIC_API_URL; leave it empty to use the API on this Mac (port 3001)
pnpm install
pnpm android              # development build on a USB-connected phone (see below)
```

This app uses native modules (Skia, MMKV, Reanimated, expo-audio, expo-speech), so it runs as a **development
build**, not Expo Go.

## Checks (run before every commit)

```bash
npx tsc --noEmit    # types
npx expo lint       # lint (React Compiler rules on)
npx expo-doctor     # SDK / dependency health
```

## Project layout

```
src/
  app/                      routes (every file is a screen)
    (auth)/                 welcome, sign in, student sign-in (username + PIN), sign up, password reset
    student/                tabs: Home · Leagues · Wallet (secondary) or Stickers (primary) · Me
      practice/, mocks/, exams/, play/, stickers.tsx, pay.tsx
    parent/                 tabs: Children · Wallet · Me
      children/, plan.tsx (BrainBox plan), rewards.tsx (airtime and data)
    tuckshop/               selling at the tuck shop
    settings/               account, notifications, privacy & data, help & support
  components/
    ui/                     BrainBox design components (GameButton, Card, ProgressBar, Skeleton, …)
    game/                   Confetti, CountUp, Flame, Pulse, PopIn, ScoreRing, Stars
    reacticx/               components copied from Reacticx (restyled via props)
    Logo.tsx, AnimatedSplash.tsx
  features/<area>/          API hooks (api.ts) and the components for that area
  lib/                      axios client, storage, formatting, push, speech (nursery voice), sounds (effects)
  store/auth.ts             session, tokens, active role
  theme/tokens.js           colours, role themes, font names (shared with tailwind.config.js)
  types/api.ts              API response shapes (mirror the backend)
assets/images               app icon, adaptive/monochrome icons, splash (the BrainBox mark)
assets/sounds               sticker-unlock effects (synthesised for BrainBox; nothing to license)
```

## Roles and worlds

One person can hold several roles (a parent can also run a tuck shop). The active role decides which world they see;
they switch on the **Me** tab.

| Role | Look | Highlights |
|---|---|---|
| Child, secondary | Violet + sunshine | Topic practice easy → hard, Friday mock, XP and levels, streaks, weekly leagues, stickers, coin bar, tuck-shop wallet |
| Child, primary | Coral + warm yellow, chunkier | One "adventure" at a time, picture-led worlds, stars, a Stickers tab |
| Child, nursery | Big pictures, read aloud | Picture questions spoken aloud (mute switch remembered on the phone) |
| Parent | Calm teal | Each child's progress and weak topics, weekly report, the BrainBox plan, rewards to collect, wallet top-up |

## Plans, stickers and rewards in the app

The numbers below (price, trial, free questions, coin rates, reward value) are **Overwatch settings**, so the app always
shows what the API sends rather than fixed values.

- **Plans.**
  - Parents see the plan screen (`parent/plan.tsx`) and a banner on their home screen for the trial countdown, a plan
    about to end, or the free plan.
  - Payment opens Squad's checkout and comes back to the app.
  - On the free plan, the parent's progress view and weekly report are hidden; Friday mock results stay.
- **Children never see anything about paying.**
  - A free-plan child sees how many of today's questions are left, then "That's it for today!".
  - No coin bar or money appears for them.
- **Stickers** (`features/student/components`).
  - 40 stickers in four rarities. The sticker book is grouped by rarity, and locked stickers show progress.
  - Each new sticker plays a full-screen **10-second unlock** (`StickerCelebration.tsx`): light rays, spin, confetti,
    haptics, sound, coins counting up, its perks (how many collectors have it, unlock order, the child's place on the
    collectors' leaderboard) and the next sticker to go for.
  - Stickers earned while the app was closed play the next time it opens.
  - Tap a collected sticker to watch it again.
- **Coins and rewards.**
  - On the trial or paid plan, children see a coin bar towards the next reward for their family.
  - Parents collect what's earned as airtime or data on `parent/rewards.tsx`.
- **Sound** (`src/lib/sounds.ts`):
  - effects stay quiet on silent or vibrate, and mix with music instead of stopping it
  - one remembered switch mutes them and the nursery voice
  - expo-audio is set up for **playback only**: the microphone permission and background audio are switched off and
    blocked in `app.json`, which matters for a children's app on Google Play

## The UX bar: every screen must have these

Every new screen must have all of these. Reviewers: send back any change missing one.

1. **Loading:** a skeleton shaped like the content (`Skeleton`, `CardListSkeleton`), never a bare spinner on a blank page.
2. **Error:** `ErrorState` with a plain-English message (`friendlyError`) and a **Try again** button.
3. **Empty:** `EmptyState` that says what will appear and what to do next.
4. **Pull to refresh** on anything that shows server data (`<Screen onRefresh>`).
5. **Feedback:** haptic tick on taps (`PressableScale`, `GameButton`), a toast or inline confirmation after every action.
6. **Accessibility:** touch targets of at least 44pt, `accessibilityLabel` on icon-only buttons, roles and states (`tab`, `radio`, `selected`, `expanded`), text 13px or larger.
7. **Motion with purpose:** progress bars fill on mount, lists stagger in, chunky buttons press down. Everything respects Reduce Motion.
8. **Theme tokens only:** colours from `src/theme/tokens.js` / Tailwind classes, never new hex values in screens (sticker rarity colours live in `Sticker.tsx`).
9. **Words a parent or child understands:** no codes or jargon. In JSX text use the curly apostrophe `’` (lint rejects a straight `'`).

## Adding a Reacticx component

```bash
npx reacticx list                 # browse
npx reacticx add <name> -y        # copies source into src/components/reacticx
npx reacticx diff <name>          # see upstream changes later
```

Restyle it with BrainBox tokens through its props (e.g. `ScoreRing` wraps `circular-progress`). Edit the copied source
only when props can't do it. In use so far: `animated-input-bar`, `circular-progress`, `number-flow`, `qr-code`,
`otp-input`, `Toast`, `verified-badge`.

Local edits to copied sources (re-apply if you pull upstream with `reacticx diff`):
- `animated-input-bar`: forwardRef, follows the `value` prop, calls the caller's `onFocus`/`onBlur`.
- `animated-input-bar`, `circular-progress`: no explicit generic on `createAnimatedComponent` (Reanimated 4 types).

`src/lib/nativewind-interop.ts` registers Reanimated's `Animated.View/Text/ScrollView` with NativeWind. Without it,
`className` on those components is silently ignored.

## Forms

Every form uses react-hook-form with a zod schema. Errors show after the first submit and clear as the user fixes them.

```tsx
const schema = z.object({ email: email(), password: password() });
const { control, handleSubmit, setFocus } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });
<FormTextField control={control} name="email" label="Email" placeholder={['ada@example.com', '0803 000 0000']} onSubmitEditing={() => setFocus('password')} />
```

- `FormTextField` wraps `TextField` (Reacticx `animated-input-bar` inside): focus ring, shake + haptic on error, and
  `placeholder` can be an array of rotating examples. `format` cleans input as it's typed (e.g. digits only).
- `FormChipGroup` / `FormMultiChipGroup` for single / multi choice.
- OTP and switches go through `<Controller>` directly.

## Game feel (`src/components/game`)

| Piece | Use it for |
|---|---|
| `Confetti` | One-shot burst (good score, level up, sticker unlock). Re-fire with a new `key`. |
| `ScoreRing` | Score sweeping round a ring while the % counts up (Reacticx `circular-progress`). |
| `Stars` + `starsForScore` | 1–3 stars popping in for primary pupils. |
| `CountUp` | Any number that should roll up (XP, stars, streak, coins). |
| `Flame` | Streak flame that flickers while the streak is alive. |
| `Pulse` | Gently breathes the "do this next" button or step. |
| `PopIn` | Staged reveals (reward cards on the results screen). |

All of them respect the phone's Reduce Motion setting. Round results get `rewards` from the API (level before/after,
streak, new stickers, coins) and reveal them one by one.

## API

Every screen talks to a real backend route; the routes and the rules behind them are described in
[`../backend/README.md`](../backend/README.md). Response shapes are in `src/types/api.ts`. `user.memberships[]` decides
which worlds a person can open. Money is sent as kobo strings.

## Running on an Android phone (development build)

```bash
pnpm install                 # pnpm-workspace.yaml already allows the native build scripts it needs
npx expo prebuild -p android # generates ./android (git-ignored; never edit it by hand)
pnpm android                 # = expo run:android: builds, installs on the USB-connected phone, starts Metro
```

Rebuild after changing `app.json` or adding a native package. The rename to BrainBox changed the package name, so the
first BrainBox build installs as a **separate app**: uninstall the old one.

Turn on USB debugging on the phone and check `adb devices` lists it. Phone and Mac must be on the same Wi-Fi so the app
can reach the API on your Mac. If pnpm prints "Ignored build scripts" for a new native package, add it under
`allowBuilds` in `pnpm-workspace.yaml`.

### Push notifications (one-time setup)

Without this the app works normally, but the phone gets no push notifications (Settings → Notifications says so). Email
still works.

1. `npx eas-cli@latest init`: links this app to your Expo account and adds `extra.eas.projectId`.
2. Firebase console → new project → add an **Android app** with the package name `com.tolulopeb.brainbox` → download
   `google-services.json` into `mobile/`. `app.config.js` picks it up automatically.
3. Firebase → Project settings → Service accounts → **Generate new private key**. Upload that JSON with
   `npx eas-cli@latest credentials` → Android → Google Service Account → *FCM V1*. Do not commit that key file.
4. `npx expo prebuild -p android --clean && pnpm android`.

## Not in the app (yet)

- **Tutors:** paused; BrainBox itself is the tutor. The backend `tutor` module is still there, unused.
- **Dark mode:** screens are light-only, so `app.json` pins `userInterfaceStyle` to `light`.
- **iOS:** not tested yet; Android and the web come first.
