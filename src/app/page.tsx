"use server";
import QRCode from "react-qr-code";
import { getNextNElements, RSSElement } from "../../server_actions/RSSFeed";


const ITEM_COUNT_PRE_FETCH = 4;

export default async function Home() {

  const RSS_Element_list = await getNextNElements(4);

  return (
    <main className="flex min-h-screen flex-col gap-8 items-center justify-between p-16 bg-gray-200">
      {RSS_Element_list.map((element) => (
        <RSSElementComponent key={element.link} element={element} />
      ))}
    </main>
  );
}

function RSSElementComponent(props : { element: RSSElement }) {

  const images = props.element.metadata?.imgTags.map((x : { src:string }) => x.src) ?? [];

  //find the first favicon with a png extension
  var source_favicon = props.element.metadata?.favicons?.find((x : { href:string }) => x.href.endsWith(".png"))?.href ?? "";
  //if the favicon is a relative path, add the base url
  if(source_favicon.startsWith("/")){
    source_favicon = new URL(props.element.link).origin + source_favicon;
  }

  console.log(props.element.metadata?.imgTags);

  return (
    <a href={props.element.link} target="_blank" rel="noreferrer" className="flex flex-row w-full relative">
      <div className="flex flex-col gap-4 justify-between p-4">
        
        
        <div className="p-2 bg-white filter drop-shadow rounded-lg h-max">
          <QRCode value={props.element.link} color="#334155" size={256} className=" flex-shrink-0 z-10 w-32 h-32 rounded" />
        </div>
      </div>
      <div className="flex flex-row w-full relative">
        <div className="h-96 aspect-video relative">
          <img src={images[0]} className="flex-shrink-0 h-96 bg-contain filter drop-shadow-2xl"/>
          <img src={source_favicon} alt="RSS Image" className="absolute bottom-0 left-0 w-24 h-24 bg-contain z-10 filter drop-shadow-md" />
        </div>
        <div className=" p-8 flex flex-col gap-2">
          <div className="flex flex-row">
            <h1 className=" text-5xl text-gray-900 font-bold">{props.element.title}</h1>
          </div>
          <p className="text-3xl text-gray-500 ">{props.element.contentSnippet}</p>
          <div className="flex flex-row gap-2">
            { images[1] && <img src={images[1]} className="w-16 h-16 bg-contain z-10 filter drop-shadow-md" /> }
            { images[2] && <img src={images[2]} className="w-16 h-16 bg-contain z-10 filter drop-shadow-md" /> }
        </div>
        </div>
      </div>
    </a>
  );
}
