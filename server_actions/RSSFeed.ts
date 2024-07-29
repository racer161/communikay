let Parser = require('rss-parser');
let parser = new Parser();
import urlMetadata from 'url-metadata';
//30 mins in milliseconds
const UPDATE_INTERVAL = 1000 * 60 * 30;

export interface RSSElementMetadataImageTag {
  src : string,
  alt : string,
  title: string,
}

export interface RSSElementMetadata {
  requestURL: string,
  imgTags : RSSElementMetadataImageTag[]
}


/*
feedUrl: 'https://www.reddit.com/.rss'
title: 'reddit: the front page of the internet'
description: ""
link: 'https://www.reddit.com/'
items:
    - title: 'The water is too deep, so he improvises'
      link: 'https://www.reddit.com/r/funny/comments/3skxqc/the_water_is_too_deep_so_he_improvises/'
      pubDate: 'Thu, 12 Nov 2015 21:16:39 +0000'
      creator: "John Doe"
      content: '<a href="http://example.com">this is a link</a> &amp; <b>this is bold text</b>'
      contentSnippet: 'this is a link & this is bold text'
      guid: 'https://www.reddit.com/r/funny/comments/3skxqc/the_water_is_too_deep_so_he_improvises/'
      categories:
          - funny
      isoDate: '2015-11-12T21:16:39.000Z'
*/
export interface RSSElement {
    title: string;
    link: string;
    pubDate: string;
    creator: string;
    content: string;
    contentSnippet: string;
    guid: string;
    categories: string[];
    isoDate: string;
    metadata?: urlMetadata.Result;

}

//last updated time in milliseconds
const RSSSchedule = new Map<string, number>();
RSSSchedule.set("https://www.reddit.com/.rss", Date.now() - UPDATE_INTERVAL -10);
RSSSchedule.set("https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml", Date.now() - UPDATE_INTERVAL -10);


//RSS Feed List
const RSSFeedMap = new Map<string, Set<RSSElement>>();


export async function loadRSSElementsForURL(url: string) {
    console.log("Loading RSS Feed for URL: " + url);
    let feed = await parser.parseURL(url);
    const items = feed.items.map((item: RSSElement) => {
        return item;
    });

    RSSFeedMap.set(url, items);
}



export async function checkIfFeedNeedsUpdate() {
    for (const [url, lastUpdated] of RSSSchedule) {
        if (Date.now() - lastUpdated > UPDATE_INTERVAL) {
            await loadRSSElementsForURL(url);
            RSSSchedule.set(url, Date.now());
        }
    }
}

export async function addLinkToRSSFeed(url: string) {
    await loadRSSElementsForURL(url);
    RSSSchedule.set(url, Date.now());
}

export async function getNextNElements(n: number) {
    await checkIfFeedNeedsUpdate();

    const elements: RSSElement[] = [];
    for (let i = 0; i < n; i++) {
      const element = await getNextFeedElement();
      elements.push(element);
    }

    return elements;
}

export async function getNextFeedElement() : Promise<RSSElement>
{
  const random_feed = Math.floor(Math.random() * RSSFeedMap.size);
  const feed_name = Array.from(RSSFeedMap.keys())[random_feed];
  const feed = RSSFeedMap.get(feed_name) as Set<RSSElement>;

  const item = feed.values().next().value;

  if(!item){
    return {
      title: "No Feed Elements",
      link: "https://www.reddit.com",
      pubDate: "",
      creator: "",
      content: "",
      contentSnippet: "",
      guid: "",
      categories: [],
      isoDate: ""
    }
  }

  console.log("Getting Feed Element: " + item.title);

  //remove the item from the feed
  RSSFeedMap.set(feed_name, new Set(Array.from(feed).filter((x) => x !== item)));

  try{
    if(!item.metadata){
      var metadata = await urlMetadata(item.link, {
        requestHeaders: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
          'Accept-Encoding': 'gzip',
          'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36'
        },
      });
      console.log(metadata);

      item.metadata = metadata;

    }
  }catch(e){
    console.error(e);
    console.error("Error getting metadata for link: " + item.link);
  }


  return item;
}