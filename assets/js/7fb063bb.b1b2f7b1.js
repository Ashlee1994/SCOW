"use strict";(self.webpackChunk_scow_docs=self.webpackChunk_scow_docs||[]).push([[9237],{4852:function(e,n,t){t.d(n,{Zo:function(){return s},kt:function(){return d}});var r=t(9231);function o(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function a(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}function l(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?a(Object(t),!0).forEach((function(n){o(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):a(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function u(e,n){if(null==e)return{};var t,r,o=function(e,n){if(null==e)return{};var t,r,o={},a=Object.keys(e);for(r=0;r<a.length;r++)t=a[r],n.indexOf(t)>=0||(o[t]=e[t]);return o}(e,n);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)t=a[r],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(o[t]=e[t])}return o}var c=r.createContext({}),i=function(e){var n=r.useContext(c),t=n;return e&&(t="function"==typeof e?e(n):l(l({},n),e)),t},s=function(e){var n=i(e.components);return r.createElement(c.Provider,{value:n},e.children)},m={inlineCode:"code",wrapper:function(e){var n=e.children;return r.createElement(r.Fragment,{},n)}},p=r.forwardRef((function(e,n){var t=e.components,o=e.mdxType,a=e.originalType,c=e.parentName,s=u(e,["components","mdxType","originalType","parentName"]),p=i(t),d=o,f=p["".concat(c,".").concat(d)]||p[d]||m[d]||a;return t?r.createElement(f,l(l({ref:n},s),{},{components:t})):r.createElement(f,l({ref:n},s))}));function d(e,n){var t=arguments,o=n&&n.mdxType;if("string"==typeof e||o){var a=t.length,l=new Array(a);l[0]=p;var u={};for(var c in n)hasOwnProperty.call(n,c)&&(u[c]=n[c]);u.originalType=e,u.mdxType="string"==typeof e?e:o,l[1]=u;for(var i=2;i<a;i++)l[i]=t[i];return r.createElement.apply(null,l)}return r.createElement.apply(null,t)}p.displayName="MDXCreateElement"},462:function(e,n,t){t.d(n,{Z:function(){return l}});var r=t(9231),o=t(1506),a="tabItem_hucY";function l(e){var n=e.children,t=e.hidden,l=e.className;return r.createElement("div",{role:"tabpanel",className:(0,o.Z)(a,l),hidden:t},n)}},9253:function(e,n,t){t.d(n,{Z:function(){return d}});var r=t(2208),o=t(9231),a=t(5375),l=t(4086),u=t(5443),c=t(6540),i=t(1506),s="tabList_HAHr",m="tabItem_Wq5N";function p(e){var n,t,a,p=e.lazy,d=e.block,f=e.defaultValue,v=e.values,b=e.groupId,y=e.className,h=o.Children.map(e.children,(function(e){if((0,o.isValidElement)(e)&&void 0!==e.props.value)return e;throw new Error("Docusaurus error: Bad <Tabs> child <"+("string"==typeof e.type?e.type:e.type.name)+'>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.')})),g=null!=v?v:h.map((function(e){var n=e.props;return{value:n.value,label:n.label,attributes:n.attributes}})),w=(0,l.l)(g,(function(e,n){return e.value===n.value}));if(w.length>0)throw new Error('Docusaurus error: Duplicate values "'+w.map((function(e){return e.value})).join(", ")+'" found in <Tabs>. Every value needs to be unique.');var O=null===f?f:null!=(n=null!=f?f:null==(t=h.find((function(e){return e.props.default})))?void 0:t.props.value)?n:null==(a=h[0])?void 0:a.props.value;if(null!==O&&!g.some((function(e){return e.value===O})))throw new Error('Docusaurus error: The <Tabs> has a defaultValue "'+O+'" but none of its children has the corresponding value. Available values are: '+g.map((function(e){return e.value})).join(", ")+". If you intend to show no default tab, use defaultValue={null} instead.");var k=(0,u.U)(),N=k.tabGroupChoices,T=k.setTabGroupChoices,E=(0,o.useState)(O),j=E[0],P=E[1],x=[],C=(0,c.o5)().blockElementScrollPositionUntilNextRender;if(null!=b){var Z=N[b];null!=Z&&Z!==j&&g.some((function(e){return e.value===Z}))&&P(Z)}var D=function(e){var n=e.currentTarget,t=x.indexOf(n),r=g[t].value;r!==j&&(C(n),P(r),null!=b&&T(b,r))},_=function(e){var n,t=null;switch(e.key){case"ArrowRight":var r=x.indexOf(e.currentTarget)+1;t=x[r]||x[0];break;case"ArrowLeft":var o=x.indexOf(e.currentTarget)-1;t=x[o]||x[x.length-1]}null==(n=t)||n.focus()};return o.createElement("div",{className:(0,i.Z)("tabs-container",s)},o.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,i.Z)("tabs",{"tabs--block":d},y)},g.map((function(e){var n=e.value,t=e.label,a=e.attributes;return o.createElement("li",(0,r.Z)({role:"tab",tabIndex:j===n?0:-1,"aria-selected":j===n,key:n,ref:function(e){return x.push(e)},onKeyDown:_,onFocus:D,onClick:D},a,{className:(0,i.Z)("tabs__item",m,null==a?void 0:a.className,{"tabs__item--active":j===n})}),null!=t?t:n)}))),p?(0,o.cloneElement)(h.filter((function(e){return e.props.value===j}))[0],{className:"margin-top--md"}):o.createElement("div",{className:"margin-top--md"},h.map((function(e,n){return(0,o.cloneElement)(e,{key:n,hidden:e.props.value!==j})}))))}function d(e){var n=(0,a.Z)();return o.createElement(p,(0,r.Z)({key:String(n)},e))}},6533:function(e,n,t){t.r(n),t.d(n,{assets:function(){return p},contentTitle:function(){return s},default:function(){return v},frontMatter:function(){return i},metadata:function(){return m},toc:function(){return d}});var r=t(2208),o=t(9161),a=(t(9231),t(4852)),l=t(9253),u=t(462),c=["components"],i={sidebar_position:3,title:"\u96c6\u7fa4\u4fe1\u606f\u914d\u7f6e\u6587\u4ef6"},s="\u7f16\u5199\u96c6\u7fa4\u4fe1\u606f\u914d\u7f6e\u6587\u4ef6",m={unversionedId:"common/deployment/clusters",id:"common/deployment/clusters",title:"\u96c6\u7fa4\u4fe1\u606f\u914d\u7f6e\u6587\u4ef6",description:"\u901a\u8fc7clusters.{json|yml|yaml}\u6587\u4ef6\u5b9a\u4e49\u96c6\u7fa4\u7684\u57fa\u672c\u4fe1\u606f\uff0c\u5982\u96c6\u7fa4\u7684\u8282\u70b9\u6570\u3001\u5185\u5b58\u3001\u6838\u5fc3\u3001GPU\u6570\u7b49\u4fe1\u606f\uff0c\u5c06\u5176\u653e\u5728config\u76ee\u5f55\u4e0b\uff0c\u5e76\u5c06\u5176\u6620\u5c04\u5404\u4e2a\u5bb9\u5668\u7684/etc/scow\u76ee\u5f55\u4e2d\u3002",source:"@site/docs/common/deployment/clusters.mdx",sourceDirName:"common/deployment",slug:"/common/deployment/clusters",permalink:"/SCOW/docs/common/deployment/clusters",draft:!1,editUrl:"https://github.com/PKUHPC/SCOW/edit/main/website/docs/common/deployment/clusters.mdx",tags:[],version:"current",sidebarPosition:3,frontMatter:{sidebar_position:3,title:"\u96c6\u7fa4\u4fe1\u606f\u914d\u7f6e\u6587\u4ef6"},sidebar:"common",previous:{title:"\u51c6\u5907\u73af\u5883",permalink:"/SCOW/docs/common/deployment/prepare"},next:{title:"\u8ba4\u8bc1\u7cfb\u7edf",permalink:"/SCOW/docs/common/deployment/auth"}},p={},d=[],f={toc:d};function v(e){var n=e.components,t=(0,o.Z)(e,c);return(0,a.kt)("wrapper",(0,r.Z)({},f,t,{components:n,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"\u7f16\u5199\u96c6\u7fa4\u4fe1\u606f\u914d\u7f6e\u6587\u4ef6"},"\u7f16\u5199\u96c6\u7fa4\u4fe1\u606f\u914d\u7f6e\u6587\u4ef6"),(0,a.kt)("p",null,"\u901a\u8fc7",(0,a.kt)("inlineCode",{parentName:"p"},"clusters.{json|yml|yaml}"),"\u6587\u4ef6\u5b9a\u4e49\u96c6\u7fa4\u7684\u57fa\u672c\u4fe1\u606f\uff0c\u5982\u96c6\u7fa4\u7684\u8282\u70b9\u6570\u3001\u5185\u5b58\u3001\u6838\u5fc3\u3001GPU\u6570\u7b49\u4fe1\u606f\uff0c\u5c06\u5176\u653e\u5728",(0,a.kt)("inlineCode",{parentName:"p"},"config"),"\u76ee\u5f55\u4e0b\uff0c\u5e76\u5c06\u5176\u6620\u5c04\u5404\u4e2a\u5bb9\u5668\u7684",(0,a.kt)("inlineCode",{parentName:"p"},"/etc/scow"),"\u76ee\u5f55\u4e2d\u3002"),(0,a.kt)(l.Z,{mdxType:"Tabs"},(0,a.kt)(u.Z,{value:"config/clusters.yml",default:!0,mdxType:"TabItem"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-yaml"},"hpc01: # \u96c6\u7fa4ID\n  displayName: hpc01Name # \u96c6\u7fa4\u7684\u540d\u79f0\n  partitions: # \u96c6\u7fa4\u7684\u5404\u4e2a\u5206\u533a\n    compute: # \u5206\u533a\u540d\n      nodes: 28 # \u5206\u533a\u5185\u8282\u70b9\u6570\n      mem: 7500 # \u5355\u8282\u70b9\u5185\u5b58\u6570\u91cf\uff0c\u5355\u4f4dM\n      cores: 2 # \u6838\u5fc3\u6570\n      gpus: 0 # GPU\u6570\n      qos: # QOS\u7684\u6570\u91cf\n      - low\n      - normal\n      - high\n      comment: '' # \u8fd9\u4e2a\u5206\u533a\u7684\u5907\u6ce8\u4fe1\u606f\n    GPU:\n      nodes: 1\n      mem: 262144\n      cores: 48\n      gpus: 8\n      qos:\n      - low\n      - normal\n      - high\n      comment: ''\n"))),(0,a.kt)(u.Z,{value:"json",label:"config/clusters.json",mdxType:"TabItem"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-json"},'{\n  "hpc01": {\n    "displayName": "hpc01Name",\n    "partitions": {\n      "compute": {\n        "nodes": 28,\n        "mem": 7500,\n        "cores": 2,\n        "gpus": 0,\n        "qos": [\n          "low",\n          "normal",\n          "high"\n        ],\n        "comment": ""\n      },\n      "GPU": {\n        "nodes": 1,\n        "mem": 262144,\n        "cores": 48,\n        "gpus": 8,\n        "qos": [\n          "low",\n          "normal",\n          "high"\n        ],\n        "comment": ""\n      }\n    }\n  }\n}\n')))))}v.isMDXComponent=!0}}]);