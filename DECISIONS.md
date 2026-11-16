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

## 3. Stream Cancellation & Race-Condition Strategy
How did you guarantee that rapid clicks across multiple events never interleave chunks or throw unhandled `AbortError` exceptions? What happens if a user selects Event A -> Event B -> Event A quickly?

## 4. State Synchronization & Render Performance
- The input updates while typing, then waits 600 ms after the last change before updating the URL and fetching results. I use push once for the settled filter, not once per keystroke. Back and Forward put the filter values back in the inputs, and the matching results load. A new fetch aborts the previous one so an older response can't replace the current results.
- The stream text is now state in its own summary output component, not in the page. I checked the page render counter while the summary streamed; the text changed while the counter stayed still.
