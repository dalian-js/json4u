"use client";
import {useMemo, useRef} from "react";
import * as color from "../lib/color";
import {IconRight} from "@arco-design/web-react/icon";

// texts 结构：{ id: { text, blink }}
export default function MsgBar({texts}) {
  const cacheMap = useRef({});
  const textsMap = useMemo(() => {
    const obj = Object.entries(Object.assign(cacheMap.current, texts)).reduce((obj, [key, value]) => {
      if (typeof value.text === "string") {
        if (value.text) {
          obj[key] = value;
        } else {
          delete obj[key];
        }
      }
      return obj;
    }, {});

    cacheMap.current = obj;
    return obj;
  }, [cacheMap, texts]);

  const keys = Object.keys(textsMap).sort();
  const leftKeys = keys.filter((key) => key.startsWith("l"));
  const rightKeys = keys.filter((key) => key.startsWith("r"));

  // 生成状态栏文本节点
  const genAlerts = (keys) => {
    return keys.map((key, i) => {
      const {text, blink} = textsMap[key];

      const className = [
        "px-2.5 py-0.5",
        blink ? "blink" : "",
        i < keys.length - 1 ? "statusbar-sep" : "",
      ].filter((c) => c).join(" ");

      return (
        <div key={key} className={className}>
          <BarStub msg={text}></BarStub>
        </div>
      );
    });
  };

  return (
    <>
      {genAlerts(leftKeys)}
      <div className="grow"></div>
      {genAlerts(rightKeys)}
    </>
  );
}

function BarStub({msg}) {
  let node;

  if (typeof window != "undefined" && typeof DOMParser != "undefined") {
    const [pureMsg, tags] = color.matchTags(msg);

    if (pureMsg && tags.length) {
      node = new DOMParser().parseFromString(msg, "text/xml");
      const err = node?.querySelector("parsererror");

      // 如果解析失败
      if (pureMsg && err) {
        node = undefined;
        console.error(`文本节点解析错误:\n\n${msg}\n\n`, err?.textContent);
      }
    }

    if (node === undefined) {
      node = document.createTextNode(pureMsg);
    }
  }

  return <BarStubNode key={`00`} node={node} level={0}></BarStubNode>;
}

// 根据 dom 树生成 span 树
function BarStubNode({node, level}) {
  // 在此添加需要特殊支持的 tag
  if (node.nodeName === "IconRight") {
    return <IconRight className="bar-right"/>;
  }

  if (!node || node.nodeType === Node.TEXT_NODE) {
    const text = node?.textContent || "";
    return <span key={`${level}`}>{text}</span>;
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
  if (node.nodeType === Node.DOCUMENT_NODE) {
    node = node.childNodes[0];
  }
  const color = node.nodeName;

  return (
    <span key={`${level}0`} className={`alert-${color}`}>
      {Array.from(node?.childNodes).map((node, i) => {
        const key = `${level}${i + 1}`;

        if (node.nodeType === Node.ELEMENT_NODE) {
          return <BarStubNode key={key} node={node} level={level + 1}></BarStubNode>;
        } else {
          return <span key={key}>{node.textContent}</span>;
        }
      })}
    </span>
  );
}
