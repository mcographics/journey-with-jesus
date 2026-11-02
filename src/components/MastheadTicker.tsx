"use client";

import { Fragment, useSyncExternalStore } from "react";

type TickerItem =
  | { id: string; kind: "theme"; text: string }
  | { id: string; kind: "verse"; words: string; reference: string };

const tickerItems: TickerItem[] = [
  { id: "journey", kind: "theme", text: "An Animated Journey Through God's Word" },
  { id: "bible-stories", kind: "theme", text: "Bible Stories" },
  { id: "conversations", kind: "theme", text: "Conversations with Jesus" },
  { id: "gospel", kind: "theme", text: "The Gospel" },
  { id: "matthew-11-28", kind: "verse", words: "Come unto me, all [ye] that labour and are heavy laden, and I will give you rest", reference: "Matthew 11:28" },
  { id: "john-14-6", kind: "verse", words: "I am the way, the truth, and the life", reference: "John 14:6" },
  { id: "john-10-11", kind: "verse", words: "I am the good shepherd", reference: "John 10:11" },
  { id: "john-8-12", kind: "verse", words: "I am the light of the world", reference: "John 8:12" },
  { id: "matthew-7-7", kind: "verse", words: "Ask, and it shall be given you", reference: "Matthew 7:7" },
  { id: "matthew-5-16", kind: "verse", words: "Let your light so shine before men", reference: "Matthew 5:16" },
  { id: "matthew-6-21", kind: "verse", words: "For where your treasure is, there will your heart be also", reference: "Matthew 6:21" },
  { id: "john-13-34", kind: "verse", words: "A new commandment I give unto you", reference: "John 13:34" },
  { id: "john-14-27", kind: "verse", words: "Peace I leave with you, my peace I give unto you", reference: "John 14:27" },
  { id: "mark-10-14", kind: "verse", words: "Suffer the little children to come unto me", reference: "Mark 10:14" },
  { id: "matthew-6-33", kind: "verse", words: "But seek ye first the kingdom of God", reference: "Matthew 6:33" },
];

function describeItem(item: TickerItem) {
  return item.kind === "theme" ? item.text : `“${item.words}” — ${item.reference}`;
}

function shuffleItems(items: TickerItem[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

let randomizedTickerItems: TickerItem[] | undefined;

function subscribeToTicker() {
  return () => {};
}

function getRandomizedTickerItems() {
  randomizedTickerItems ??= shuffleItems(tickerItems);
  return randomizedTickerItems;
}

function getServerTickerItems() {
  return tickerItems;
}

function TickerSequence({ items }: { items: TickerItem[] }) {
  return (
    <div className="masthead-ticker-cycle">
      {items.map((item, index) => (
        <Fragment key={item.id}>
          <span className={`masthead-ticker-item${item.kind === "verse" ? " masthead-ticker-verse" : ""}`}>
            {item.kind === "theme" ? (
              item.text
            ) : (
              <>
                <span className="masthead-ticker-words">“{item.words}”</span>
                <span className="masthead-ticker-reference"> — {item.reference}</span>
              </>
            )}
          </span>
          {index < items.length - 1 && <span className="masthead-ticker-separator" aria-hidden="true">✦</span>}
        </Fragment>
      ))}
    </div>
  );
}

export default function MastheadTicker() {
  const items = useSyncExternalStore(subscribeToTicker, getRandomizedTickerItems, getServerTickerItems);

  return (
    <div className="masthead-ticker">
      <p className="visually-hidden">Journey with Jesus ticker. {tickerItems.map(describeItem).join(". ")}.</p>
      <div className="masthead-ticker-window" aria-hidden="true">
        <div className="masthead-ticker-track">
          <TickerSequence items={items} />
          <TickerSequence items={items} />
        </div>
      </div>
    </div>
  );
}
