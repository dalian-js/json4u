"use client";
import "@arco-design/web-react/dist/css/arco.css";
import dynamic from "next/dynamic";
import {useEffect, useRef, useState} from "react";
import {useDispatch, useSelector} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import * as Sentry from "@sentry/react";
import Dragbar from "@/components/dragbar";
import Loading from "@/components/loading";
import StatusBar from "@/components/statusBar";
import {FormatSwitch, NestParseSwitch, SortSwitch} from "@/components/switch";
import {CompareButton, FormatButton, MinifyButton, ShareButton, TextCompareAfterSortButton} from "@/components/button";
import {LeftMenu} from "@/components/menu";
import version from "@/lib/version";
import * as jq from "@/lib/jq";
import {setWorker} from '@/reducers';
import {focusLeftSelector, leftEditorSelector, leftWidthSelector, persistor, rightEditorSelector} from '@/lib/store';
import {notFound, useSearchParams} from "next/navigation";

const now = performance.now();
const MyEditor = dynamic(() => import("../components/editor"), {
  ssr: false,
});

export default function Home() {
  const dispatch = useDispatch();
  const leftEditor = useSelector(leftEditorSelector);
  const rightEditor = useSelector(rightEditorSelector);
  const hasWindow = typeof window !== "undefined";

  const searchParams = useSearchParams();
  const shareID = searchParams.get('share') || '';
  const [dataLoaded, setDataLoaded] = useState(false);
  const [data, setData] = useState(null);
  const loaded = Boolean(leftEditor && rightEditor && (dataLoaded || !shareID));

  // 初始化 web worker
  useEffect(() => {
    if (hasWindow) {
      const worker = new Worker(new URL('../lib/worker.js', import.meta.url));
      dispatch(setWorker(worker));
      const _ = jq.init();
      return () => worker.terminate();
    }
  }, [dispatch, hasWindow]);

  // 打印资源加载耗时
  useEffect(() => {
    if (loaded) {
      let cost = performance.now() - now;
      cost = (cost / 1000).toFixed(2);
      console.log(`JSON For You：版本 ${version}，加载耗时 ${cost}s`);
    }
  }, [loaded]);

  // 加载页面数据
  useEffect(() => {
    if (shareID) {
      fetch(`https://api.json4u.com/api/share?id=${shareID}`)
        .then((resp) => resp.json())
        .then((data) => {
          const e = data?.error;
          if (e) {
            console.error(`加载分享内容失败：${e}`);
          } else {
            setData(data);
          }
        })
        .catch((e) => console.error(`加载分享内容失败：${e}`))
        .finally(() => setDataLoaded(true));
    }
  }, [shareID]);

  // 执行初始化完成动作
  useEffect(() => {
    if (loaded && dataLoaded && !data) {
      notFound();
    }

    if (loaded && dataLoaded && data) {
      const {left, right, lastAction} = data;
      leftEditor.setText(left.text);
      rightEditor.setText(right.text);

      if (lastAction?.action === 'Compare') {
        rightEditor.compare(lastAction.options, () => {
          leftEditor.revealLine(left.lineNumber, 1);
          rightEditor.revealLine(right.lineNumber, 1);
        });
      } else {
        leftEditor.revealLine(left.lineNumber, 1);
        rightEditor.revealLine(right.lineNumber, 1);
      }
    }
  }, [loaded, dataLoaded, data]);

  return <Sentry.ErrorBoundary>
    {loaded ? <></> : <Loading/>}
    <PersistGate persistor={persistor}>
      <Page loaded={loaded}/>
    </PersistGate>
  </Sentry.ErrorBoundary>;
}

function Page({loaded}) {
  const editorHeight = "calc(100vh - 6rem)";
  const leftWidth = useSelector(leftWidthSelector);
  const focusLeft = useSelector(focusLeftSelector);
  const leftContainerRef = useRef(null);

  const activeLeftBorder = focusLeft && leftWidth < 100;
  const activeRightBorder = !focusLeft && leftWidth > 0;

  return <div className={`gap-2 mx-5 mt-2 ${loaded ? "" : "hidden"}`}>
    <div className="flex">
      <div className="flex flex-col shrink min-w-fit relative gap-2"
           ref={leftContainerRef}
           style={{flexBasis: `${leftWidth}%`}}>
        <div className={`left-el flex relative justify-between clear-both ${leftWidth === 0 ? "hidden" : ""}`}>
          <ul className="flex space-x-2 items-center">
            <li><FormatButton/></li>
            <li><MinifyButton/></li>
            <li><LeftMenu/></li>
            <li><FormatSwitch/></li>
            <li><SortSwitch/></li>
            <li><NestParseSwitch/></li>
          </ul>
        </div>
        <div id="leftEditor"
             className={`left-el grow border border-solid ${activeLeftBorder ? "border-active" : "border-color"} ${leftWidth === 0 ? "hidden" : ""}`}>
          <MyEditor side="left" height={editorHeight}></MyEditor>
        </div>
      </div>
      <div className="relative flex flex-col-reverse gap-2">
        <Dragbar leftContainerRef={leftContainerRef}></Dragbar>
        <div className="h-[24px]"></div>
      </div>
      <div className={`right-el flex flex-col grow shrink min-w-fit gap-2 ${leftWidth === 100 ? "hidden" : ""}`}>
        <ul className="flex space-x-2 items-center">
          <li><CompareButton/></li>
          <li><TextCompareAfterSortButton/></li>
          <li><ShareButton/></li>
        </ul>
        <div id="rightEditor"
             className={`border border-solid ${activeRightBorder ? "border-active" : "border-color"}`}>
          <MyEditor side="right" height={editorHeight}></MyEditor>
        </div>
      </div>
    </div>
    <StatusBar/>
  </div>;
}
