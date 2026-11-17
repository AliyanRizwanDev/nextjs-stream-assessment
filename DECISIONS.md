# Frontend Architecture & Debugging Decisions

Please answer these four questions concisely before submitting your solution.

## 1. Root-Cause Diagnosis
What caused each of the three reported issues in the starter codebase?
- **Stream cross-contamination:**
  Clicking another event started a second request, but the first one kept running. Both wrote to `summaryText`, so chunks from the first event could show up in the second summary.
- **Duplicate fetches & broken history navigation:**
  Changing a filter updated the URL and fetched results right away. While typing, that meant a request for each partial search. The URL-reading effect could update local state too, causing more fetches. Since each change used `push`, Back stepped through the partial searches.
- **Render cascade during streaming:**
  `summaryText` was state in the page component. Every stream chunk re-rendered the page, including the filters and event list. The payload formatter also ran its formatting work again on every chunk.

## 2. Server vs. Client Component Boundaries
Which parts of the application did you move to Server Components vs. keep as Client Components, and why? What serializable props cross the boundary?
The root layout was already a Server Component. The route page is one now too: it reads the URL filters and gets the matching events. It passes the events and filter strings to the client dashboard. The dashboard handles typing and event selection, and the summary stays client-side to read the stream. Those props are plain strings and event objects.

## 3. Stream Cancellation & Race-Condition Strategy
How did you guarantee that rapid clicks across multiple events never interleave chunks or throw unhandled `AbortError` exceptions? What happens if a user selects Event A -> Event B -> Event A quickly?
The summary component owns the request. When it unmounts after another selection, its cleanup aborts the fetch and marks that request inactive. The catch ignores errors from an aborted request, and the inactive request can't add more text. The selection key changes on every click, so A -> B -> A starts a fresh request for the second A.

## 4. State Synchronization & Render Performance
- The input updates while typing, then waits 600 ms after the last change before updating the URL. The server page returns the matching events for that URL, so the dashboard doesn't send a separate events API request for every keystroke. Back and Forward update the inputs and results too.
- The stream text is now state in its own summary output component, not in the page. I checked the page render counter while the summary streamed; the text changed while the counter stayed still.
