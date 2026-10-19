# Nexus Mobile

The Nexus app for **students**, **parents** and **tuck-shop staff**. School staff and the
Overwatch admin team use the web app (`../frontend`). Everything talks to the API in `../backend`.

## Stack

| Concern | Choice |
|---|---|
| Framework | Expo SDK 57, Expo Router (file-based routes in `src/app`) |
| Styling | Tailwind via **NativeWind 4** (`className="..."`) |
| Server data | **TanStack Query** (`src/features/*/api.ts`) |
| App state | **Zustand** (`src/store`, persisted to the device keychain) |
| HTTP | **axios** with auth + token-refresh interceptors (`src/lib/api.ts`) |
| Forms | **react-hook-form** + **zod** (`src/components/form`, shared rules in `src/lib/validation.ts`) |
| Animated components | **Reacticx**, copied into `src/components/reacticx` |
| Motion & haptics | Reanimated 4, Gesture Handler, expo-haptics |
| Fonts | Bricolage Grotesque (headings, numbers) + Figtree (text) |

## Getting started

```bash
cp .env.example .env      # set EXPO_PUBLIC_API_URL; keep USE_MOCKS=true until the API is ready
npm install
npx expo start            # press i (iOS simulator), a (Android) or scan the QR code
```

**Demo mode** (`EXPO_PUBLIC_USE_MOCKS=true`): every screen runs on sample data in
`src/features/mocks.ts`, so you can click through the whole app without the backend.

- Sign in with an email starting `parent…` → parent app; anything else → student.
- Student login: any school code and PIN. Username `tobi` → the **primary-school** experience.

Some Reacticx components (and Skia) need a **development build** rather than Expo Go:
`npx expo run:ios` / `npx expo run:android`, or `npx eas-cli@latest build --profile development`.
pnpm only runs build scripts for packages listed under `allowBuilds` in `pnpm-workspace.yaml`
(Skia is already there). If pnpm prints "Ignored build scripts" for a new native package, add it there.

## Checks (run before every commit)

```bash
npx tsc --noEmit    # types
npx expo lint       # lint (React Compiler rules on)
npx expo-doctor     # SDK / dependency health
```

## Project layout

```
src/
  app/                    routes (every file is a screen)
    (auth)/               welcome, login, student-login (PIN), forgot-password
    (student)/            tabs: Home · Leagues / My class · Wallet / Stickers · Me
    (parent)/             tabs: Reports · Fees & wallet · Me
    index.tsx             sends each person to their role's world
  components/
    ui/                   Nexus design components (GameButton, Card, ProgressBar, Skeleton, …)
    reacticx/             components copied from Reacticx (restyled via props)
    TabBar.tsx            one tab bar for every role; "playful" variant for primary kids
    ProfileScreen.tsx     shared Me tab incl. role switcher
  features/<area>/api.ts  TanStack Query hooks: one per endpoint, mock fallback built in
  features/mocks.ts       demo data
  lib/                    axios client, query client, secure storage, formatting
  store/auth.ts           session, tokens, active role (Zustand + SecureStore)
  theme/tokens.js         colours, role themes, font names — shared with tailwind.config.js
  types/api.ts            API response shapes (mirror backend/prisma/schema.prisma)
```

## Roles and worlds

One person can hold several roles (a parent can also run a tuck shop). The active role
decides which world they see; they switch on the **Me** tab.

| Role | Look | Highlights |
|---|---|---|
| Student, secondary | Violet + sunshine | XP and levels, streaks, weekly leagues with a promotion zone, quests, tuck-shop wallet with a QR pay code |
| Student, primary | Coral + warm yellow, chunkier | One "adventure" at a time, picture-led worlds, stars and stickers instead of money, floating tab bar with no small labels |
| Parent | Calm teal | AI weekly report per child, subject scores, home tips, wallet top-up |

Lesson-teacher matching is paused (Nexus itself is the tutor). The tutor screens were removed in
git; the backend `tutor` module is still there, unused.

## The UX bar: every screen must have these

Every new screen must have all of these. Reviewers: send back any PR missing one.

1. **Loading:** a skeleton shaped like the content (`Skeleton`, `CardListSkeleton`), never a bare spinner on a blank page.
2. **Error:** `ErrorState` with a plain-English message (`friendlyError`) and a **Try again** button.
3. **Empty:** `EmptyState` that says what will appear and what to do next.
4. **Pull to refresh** on anything that shows server data (`<Screen onRefresh>`).
5. **Feedback:** haptic tick on taps (`PressableScale`, `GameButton`), a toast or inline confirmation after every action.
6. **Accessibility:** touch targets of at least 44pt, `accessibilityLabel` on icon-only buttons, roles and states (`tab`, `radio`, `selected`, `expanded`), text 13px or larger.
7. **Motion with purpose:** progress bars fill on mount, lists stagger in, chunky buttons press down. Nothing loops except loading states.
8. **Theme tokens only:** colours from `src/theme/tokens.js` / Tailwind classes, never new hex values in screens.
9. **Words a parent or child understands:** no codes or jargon. In JSX text use the curly apostrophe `’` (lint rejects a straight `'`).

## Adding a Reacticx component

```bash
npx reacticx list                 # browse
npx reacticx add <name> -y        # copies source into src/components/reacticx
npx reacticx diff <name>          # see upstream changes later
```

Restyle it with Nexus tokens through its props (e.g. `ScoreRing` wraps
`circular-progress`). Edit the copied source only when props can't do it.
In use so far: `animated-input-bar`, `circular-progress`, `number-flow`, `qr-code`, `otp-input`, `Toast`, `verified-badge`.

Local edits to copied sources (re-apply if you pull upstream with `reacticx diff`):
- `animated-input-bar`: forwardRef, follows the `value` prop, calls the caller's `onFocus`/`onBlur`.
- `animated-input-bar`, `circular-progress`: no explicit generic on `createAnimatedComponent` (Reanimated 4 types).

`src/lib/nativewind-interop.ts` registers Reanimated's `Animated.View/Text/ScrollView` with
NativeWind. Without it, `className` on those components is silently ignored.

## Forms

Every form uses react-hook-form with a zod schema. Errors show after the first submit and
clear as the user fixes them.

```tsx
const schema = z.object({ email: email(), password: password() });
const { control, handleSubmit, setFocus } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });
<FormTextField control={control} name="email" label="Email" placeholder={['ada@example.com', '0803 000 0000']} onSubmitEditing={() => setFocus('password')} />
```

- `FormTextField` wraps `TextField` (Reacticx `animated-input-bar` inside): focus ring, shake +
  haptic on error, and `placeholder` can be an array of rotating examples. `format` cleans input
  as it's typed (e.g. digits only).
- `FormChipGroup` / `FormMultiChipGroup` for single / multi choice.
- OTP and switches go through `<Controller>` directly.

## Game feel (`src/components/game`)

| Piece | Use it for |
|---|---|
| `Confetti` | One-shot burst (good score, level up). Re-fire with a new `key`. |
| `ScoreRing` | Score sweeping round a ring while the % counts up (Reacticx `circular-progress`). |
| `Stars` + `starsForScore` | 1–3 stars popping in for primary pupils. |
| `CountUp` | Any number that should roll up (XP, stars, streak). |
| `Flame` | Streak flame that flickers while the streak is alive. |
| `Pulse` | Gently breathes the "do this next" button or step. |
| `PopIn` | Staged reveals (reward cards on the results screen). |

All of them respect the phone's Reduce Motion setting. Quest results get `rewards` from the API
(level before/after, streak, new badges) and reveal them one by one.

## API endpoints the app expects

Hooks call these when mocks are off. The backend still needs to build them.

| Method | Path | Used by |
|---|---|---|
| POST | `/auth/login` `{ identifier, password }` → `{ accessToken, refreshToken, user }` | login |
| POST | `/auth/student-login` `{ schoolCode, username, pin }` | student login |
| POST | `/auth/refresh` `{ refreshToken }` | axios interceptor |
| POST | `/auth/forgot-password` `{ identifier }` | forgot password |
| GET | `/me/student/home` | student home |
| GET | `/me/student/league` | leagues |
| GET | `/me/wallet` | student wallet |
| GET | `/parent/children` | parent tabs |
| GET | `/parent/children/:id/reports/latest` | weekly report |

`user.memberships[]` drives which worlds a person can open. Money is sent as kobo strings.

## Status

Every screen in the app is built and talks to a real backend route. No "coming soon" toasts are left.
What's still open is outside this app:

- **School fee invoices:** parents will see and pay them here once schools can create them from the
  web dashboard (in progress).
- **Tutor interviews and approval** happen in Overwatch (web). The tutor app already shows each step.
- **Dark mode:** screens are light-only, so `app.json` pins `userInterfaceStyle` to `light`.

## Running on an Android phone (development build)

This app uses native modules (Skia, MMKV, Reanimated), so it runs as a **development build**, not Expo Go.

```bash
pnpm install                 # pnpm-workspace.yaml already allows Skia's build script
npx expo prebuild -p android # generates ./android (git-ignored; never edit it by hand)
pnpm android                 # = expo run:android: builds, installs on the USB-connected phone, starts Metro
```

### Push notifications (one-time setup)

Without this the app works normally, but the phone gets no push notifications (Settings →
Notifications says so). Email still works.

1. `npx eas-cli@latest init`: links this app to your Expo account and adds `extra.eas.projectId`.
2. Firebase console → new project → add an **Android app** with the package name from
   `npx expo config --type public | grep package` → download `google-services.json` into `mobile/`.
   `app.config.js` picks it up automatically.
3. Firebase → Project settings → Service accounts → **Generate new private key**. Upload that JSON
   with `npx eas-cli@latest credentials` → Android → Google Service Account → *FCM V1*.
   Do not commit that key file.
4. `npx expo prebuild -p android --clean && pnpm android`.

Turn on USB debugging on the phone and check `adb devices` lists it. Phone and Mac must be on the same
Wi-Fi so the app can reach the API on your Mac. After changing `app.json` or adding a native package,
run prebuild again.
