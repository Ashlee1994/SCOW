"use strict";(self.webpackChunk_scow_docs=self.webpackChunk_scow_docs||[]).push([[4013],{7029:function(e,t,a){a.d(t,{Z:function(){return k}});var n=a(2854),r=a(9231),l=a(1506),c=a(1468),i=a(1345),s=a(9410),m=a(6561),o="sidebar_PePv",u="sidebarItemTitle_insB",d="sidebarItemList_dvtw",g="sidebarItem_AhxU",E="sidebarItemLink_L3QL",b="sidebarItemLinkActive_E7jl";function v(e){var t=e.sidebar;return r.createElement("aside",{className:"col col--3"},r.createElement("nav",{className:(0,l.Z)(o,"thin-scrollbar"),"aria-label":(0,m.I)({id:"theme.blog.sidebar.navAriaLabel",message:"Blog recent posts navigation",description:"The ARIA label for recent posts in the blog sidebar"})},r.createElement("div",{className:(0,l.Z)(u,"margin-bottom--md")},t.title),r.createElement("ul",{className:(0,l.Z)(d,"clean-list")},t.items.map((function(e){return r.createElement("li",{key:e.permalink,className:g},r.createElement(s.Z,{isNavLink:!0,to:e.permalink,className:E,activeClassName:b},e.title))})))))}var p=a(2459);function f(e){var t=e.sidebar;return r.createElement("ul",{className:"menu__list"},t.items.map((function(e){return r.createElement("li",{key:e.permalink,className:"menu__list-item"},r.createElement(s.Z,{isNavLink:!0,to:e.permalink,className:"menu__link",activeClassName:"menu__link--active"},e.title))})))}function h(e){return r.createElement(p.Zo,{component:f,props:e})}function _(e){var t=e.sidebar,a=(0,i.i)();return null!=t&&t.items.length?"mobile"===a?r.createElement(h,{sidebar:t}):r.createElement(v,{sidebar:t}):null}var N=["sidebar","toc","children"];function k(e){var t=e.sidebar,a=e.toc,i=e.children,s=(0,n.Z)(e,N),m=t&&t.items.length>0;return r.createElement(c.Z,s,r.createElement("div",{className:"container margin-vert--lg"},r.createElement("div",{className:"row"},r.createElement(_,{sidebar:t}),r.createElement("main",{className:(0,l.Z)("col",{"col--7":m,"col--9 col--offset-1":!m}),itemScope:!0,itemType:"http://schema.org/Blog"},i),a&&r.createElement("div",{className:"col col--2"},a))))}},948:function(e,t,a){a.r(t),a.d(t,{default:function(){return E}});var n=a(9231),r=a(1506),l=a(6561);var c=a(4951),i=a(6842),s=a(7029),m=a(2619),o="tag_RZdq";function u(e){var t=e.letterEntry;return n.createElement("article",null,n.createElement("h2",null,t.letter),n.createElement("ul",{className:"padding--none"},t.tags.map((function(e){return n.createElement("li",{key:e.permalink,className:o},n.createElement(m.Z,e))}))),n.createElement("hr",null))}function d(e){var t=function(e){var t={};return Object.values(e).forEach((function(e){var a=function(e){return e[0].toUpperCase()}(e.label);null!=t[a]||(t[a]=[]),t[a].push(e)})),Object.entries(t).sort((function(e,t){var a=e[0],n=t[0];return a.localeCompare(n)})).map((function(e){return{letter:e[0],tags:e[1].sort((function(e,t){return e.label.localeCompare(t.label)}))}}))}(e.tags);return n.createElement("section",{className:"margin-vert--lg"},t.map((function(e){return n.createElement(u,{key:e.letter,letterEntry:e})})))}var g=a(8701);function E(e){var t=e.tags,a=e.sidebar,m=(0,l.I)({id:"theme.tags.tagsPageTitle",message:"Tags",description:"The title of the tag list page"});return n.createElement(c.FG,{className:(0,r.Z)(i.k.wrapper.blogPages,i.k.page.blogTagsListPage)},n.createElement(c.d,{title:m}),n.createElement(g.Z,{tag:"blog_tags_list"}),n.createElement(s.Z,{sidebar:a},n.createElement("h1",null,m),n.createElement(d,{tags:t})))}},2619:function(e,t,a){a.d(t,{Z:function(){return m}});var n=a(9231),r=a(1506),l=a(9410),c="tag_mRP8",i="tagRegular_zEDw",s="tagWithCount_y0WN";function m(e){var t=e.permalink,a=e.label,m=e.count;return n.createElement(l.Z,{href:t,className:(0,r.Z)(c,m?s:i)},a,m&&n.createElement("span",null,m))}}}]);