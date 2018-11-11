(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.derequire = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Dialog
 * 17/10/18 - 增加Dialog.toast(msg,[options]) 提示组件。
 * 17/9/20 - 修复当Dialog在最大化状态下页面resize时Dialog位置错误问题。
 *
 * @author yswang
 * @version 4.3.0 2017/10/18
 */
(function (root, doc, undefined) {
	
	var _isIE6 = !-[1,]&&!root.XMLHttpRequest,
	
	_isFunc = function(func) {
		return func && typeof func === 'function';
	},
	
	// 获取最顶层的window对象
	_topWin = (function() {
		var twin = root;
		while(twin.parent && twin.parent !== twin) {
		  try {
				// 跨域
				if(twin.parent.document.domain !== doc.domain) {
					break;
				}
		  } catch(e) {
				break;
		  }
			twin = twin.parent;
		};
		return twin;
	})(),
	
	// 计算window相关尺寸
	_winSize = function(win) {
		win = win || root;
		var doc = win.document,
				cw = doc.compatMode === "BackCompat" ? doc.body.clientWidth : doc.documentElement.clientWidth,
				ch = doc.compatMode === "BackCompat" ? doc.body.clientHeight : doc.documentElement.clientHeight,
				sl = Math.max(doc.documentElement.scrollLeft, doc.body.scrollLeft),
				st = Math.max(doc.documentElement.scrollTop, doc.body.scrollTop),
				sw = Math.max(doc.documentElement.scrollWidth, doc.body.scrollWidth),
				sh = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight);
	    
		(sh < ch) && (sh = ch);

	  return { "cw": cw, "ch": ch, "sl": sl, "st": st, "sw": sw, "sh": sh };
	},
	
  // 获取相对文档的坐标
	_offset = function(elem, relative, doc) {
		var lft = elem.offsetLeft, 
				top = elem.offsetTop, 
				op = elem.offsetParent;
				
		while(op != null) {
			lft += op.offsetLeft;
			top += op.offsetTop;
			op = op.offsetParent;
		}
		
		if(relative) {
			!doc && (doc = document);
			var sl = st = 0;
			if(doc.compatMode == 'BackCompat') {
				sl = doc.body.scrollLeft;
				st = doc.body.scrollTop;
			} else {
				sl = doc.documentElement.scrollLeft;
				st = doc.documentElement.scrollTop;
			}
			
			lft -= sl;
			top -= st;
		}
		
		return {'left': lft, 'top': top, 'right': (lft + elem.offsetWidth), 'bottom': (top + elem.offsetHeight)};
	},
	
	// 获取滚动条宽度
	_scrollSize = function(doc) {
		!doc && (doc=document);
		var spacer = doc.createElement('div');
		spacer.style.cssText = 'position:absolute;left:0;top:-999px;width:100px;height:100px;overflow:scroll;';
		doc.body.appendChild(spacer);
		var ssize = spacer.offsetWidth - spacer.clientWidth;
		doc.body.removeChild(spacer);
		return ssize;
	},
	
	// 事件处理
	_EvtUtils = (function() {
		var i = 1, listeners = {};
		return {
			bind: function(elem, type, callback, useCapture) {
				var _capture = useCapture !== undefined ? useCapture : false;
				elem.addEventListener ? elem.addEventListener(type, callback, _capture) 
									  : elem.attachEvent('on' + type, callback);
			},
			unbind: function(elem, type, callback, useCapture){
				var _capture = useCapture !== undefined ? useCapture : false;
				elem.removeEventListener ? elem.removeEventListener(type, callback, _capture) 
						                 : elem.detachEvent('on' + type, callback);
			},
			add: function(elem, type, callback) {
				_EvtUtils.bind(elem, type, callback, false);
				listeners[i] = {"elem": elem, "type": type, "callback": callback, "capture": false};
				return (i++);
			},
			remove: function(id) {
				if (listeners.hasOwnProperty(id)) {
					var h = listeners[id];
					_EvtUtils.unbind(h.elem, h.type, h.callback, h.capture);
					delete listeners[id];
				}
			},
			fix: function(evt) {
				var sl = Math.max(doc.documentElement.scrollLeft, doc.body.scrollLeft),
					st = Math.max(doc.documentElement.scrollTop, doc.body.scrollTop),
					eventObj = {
						target: evt.srcElement || evt.target,
						pageX: (evt.clientX + sl - doc.body.clientLeft),
						pageY: (evt.clientY + st - doc.body.clientTop),
						preventDefault: function () {evt.returnValue = false;},
						stopPropagation: function () {evt.cancelBubble = true;}
					};
				
				// IE6/7/8 在原生window.event对象写入数据会导致内存无法回收，应当采用拷贝
				for(var i in evt) {
					eventObj[i] = evt[i];
				}
				
				return eventObj;
			},
			stop: function(evt) {
				if(evt.stopPropagation) {
					evt.preventDefault();
					evt.stopPropagation();
				}else {
					evt.cancelBubble = true;
					evt.returnValue = false;
				}
			}
		};
	})(),
	
	// css相关操作
	_css = (function(){
		return {
			'get': ('defaultView' in doc) && ('getComputedStyle' in doc.defaultView) ?
				function (elem, name) {
					// borderLeftWidth 格式变为 border-left-width格式
					name = name.replace(/([A-Z]|^ms)/g, '-$1').toLowerCase();
					return doc.defaultView.getComputedStyle(elem, false).getPropertyValue(name);
				} : function (elem, name) {
					// border-left-width 格式变为 borderLeftWidth 格式
					name = name.replace(/^-ms-/, 'ms-').replace(/-([a-z]|[0-9])/ig, function(all, letter) {
						return (letter + '').toUpperCase();
					});	
					return elem.currentStyle[name];
			},
			'has': function(elem, clsname) {
				//return new RegExp("(^|\\s)" + clsname + "(\\s|$)").test(elem.className);
				// 采用最简单的方法
				return (' '+ elem.className +' ').indexOf(' '+ clsname +' ') !== -1;
			},
			'add': function(elem, clsname) {
				!_css.has(elem, clsname) && (elem.className += (' '+ clsname));
			},
			'remove': function(elem, clsname) {
				_css.has(elem, clsname) && (elem.className = elem.className.replace(new RegExp('(^|\\s)' + clsname + '(\\s|$)'), ' ').replace(/^\s+|\s+$/g, ''));
			}
		};
	})();
	
	_int = function(str, defVal) {
		var val = parseInt(str, 10);
		return isNaN(val) ? defVal : val;
	},
	
	// 获取url中的参数
	_queryParam = function(url, name){
		var sUrl = url.slice(url.indexOf('?') + 1),
				r = sUrl.match(new RegExp('(^|&)' + name + '=([^&]*)(&|$)'));
		return (r === null ? null : unescape(r[2]));
	},
	
	// 支持innerHTML中包含<style>和<script>脚本
	_innerHTML = function(el, htmlCode, win) {
		if(!el || htmlCode === null || typeof htmlCode === 'undefined') { 
			return; 
		}
		
		if(htmlCode.indexOf('<') === -1) {
			el.innerHTML = htmlCode;
			return;
		}
		
		// for IE innerHTML css style hack
		htmlCode = '<i style="display:none;">for IE css hack</i>'+ htmlCode;
		el.innerHTML = htmlCode;
		// for IE css hack
		el.removeChild(el.firstChild);
		
		var scripts = el.getElementsByTagName('script'), 
			oScript = null, srcs= [], loaded = [], text = [], i, 
			eDoc = el.ownerDocument, 
			head = eDoc.getElementsByTagName('head')[0] || eDoc.documentElement;
		
		// 动态执行脚本
		var evalScript = function(data) {
			var script = eDoc.createElement('script');
		    script.type = 'text/javascript';
		    try {
		      script.appendChild(eDoc.createTextNode(data));      
		    } catch(e) {
		      // IE hack
		      script.text = data;
		    }

		    head.insertBefore(script, head.firstChild);
		    head.removeChild(script);
		    script = null;
		};
		
		if(!scripts || scripts.length === 0) {
			eDoc = head = null;
			return;
		}
		
		for(i = 0; i < scripts.length; i++) {
			oScript = scripts[i];
			// 不是标准的script脚本，不进行额外处理
			var otype = oScript.getAttribute('type');
			if(otype && otype.length > 0 
					&& !(/^(text\/javascript|text\/vbscript|text\/ecmascript|application\/javascript|application\/ecmascript)$/.test(otype.replace(/^\s+|\s+$/g, '').toLowerCase()))) {
				continue;
			}

			if(oScript.src) {
				srcs.push(oScript.src);
				loaded.push(0);
			} else {
				text.push(oScript.text || oScript.textContent || oScript.innerHTML || '');
			}
		}
		
		if(srcs.length === 0) {
			evalScript(text.join(' '));
			eDoc = head = null;
			return;
		}
		
		for(i = 0; i < srcs.length; i++) {
			(function(a){
				var script = eDoc.createElement('script');
				script.setAttribute('type', 'text/javascript');
				try {
					script.setAttribute('defer', 'defer');
				} catch(e){}
				
				script.setAttribute('src', srcs[a]);
				script.onload = script.onreadystatechange = function() {
					if(!loaded[a] && (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete')) {
						loaded[a] = 1;
						script.onload = script.onreadystatechange = null;
						if(head && script.parentNode) {
							head.removeChild(script);
							script = null;
						}
					}
				};
				
				head.insertBefore(script, head.firstChild);
			})(i);
		}
		
		// 保证所有js文件全部加载完毕后才进行script代码执行
		var checkDone = function() {
			var s = 0;
			for(var i = 0; i < loaded.length; i++) {
				s += loaded[i];
			}
			
			var done = (s === loaded.length);
			if(done) {
				root.clearTimeout(root['_idlg_scriptloaded_tid']);
				evalScript(text.join(' '));
				eDoc = head = null;
				return;
			}
			
			root['_idlg_scriptloaded_tid'] = root.setTimeout(function() {
				root.clearTimeout(root['_idlg_scriptloaded_tid']);
				checkDone();
			}, 4);
		};
		
		checkDone();
	},
	
	// 获取当前加载的js的url路径
	_selfPath = (function(scripts) {
		return scripts[scripts.length-1].src;
	})(doc.getElementsByTagName('script'));
	
	
	// 开启IE6 CSS背景图片缓存，避免背景图片闪烁
	 try {
   		doc.execCommand('BackgroundImageCache', false, true);
   } catch(e) {}
	
     
	//-----------------------------------------------------------------------------------
	//	对话框模块， 核心类 Dialog
	//-----------------------------------------------------------------------------------
	var Dialog = function(config) {

		var cfg = config || {}, dlg = null;
		
		// 合并配置项
		for(var p in Dialog.defaults) {
			if(!cfg.hasOwnProperty(p)) {
				cfg[p] = Dialog.defaults[p];
			}
		}
		
		cfg.id = cfg.id || 'idlg'+ (+new Date());
		
		for(var i = 0, len = _topWin['_idlg_list_'].length; i < len; i++) {
			if(_topWin['_idlg_list_'][i].id === cfg.id) {
				dlg = _topWin['_idlg_list_'][i];
			}
		}

		if(dlg) {
			dlg.focus();
			return dlg;
		}
		
		var _follow = cfg.follow || {'target': null};
		if(typeof _follow === 'string' || _follow.tagName) {
			_follow = {'target': _follow.tagName ? _follow : document.getElementById(_follow), 
									'placement':'bottom' };
		} 
		else if(typeof _follow === 'object' && _follow['target']) {
			_follow = {'target': typeof _follow['target'] === 'string' ? document.getElementById(_follow['target']) : _follow['target'],
                  'placement': _follow['placement'] };
		}
		
		if(_follow && _follow['target']) {
			cfg.follow = _follow;
			cfg.context = root;
			cfg.fixed = false;
			cfg.modal = false;
		}

		// 指定了Dialog显示的容器
		if(cfg.container) {
			cfg.container = typeof cfg.container === 'string' 
												? document.getElementById(cfg.container) 
												: cfg.container;
			if(!cfg.container.tagName) {
				throw new Error('Dialog `container` must be Html Element object!');
			}

			cfg.context = cfg.container.ownerDocument.defaultView || cfg.container.ownerDocument.parentWindow;
			cfg.fixed = false;
			
			if('BODY' !== cfg.container.tagName) {
				cfg.modal = false;
				cfg.dragable = false;
			}
		}
		
		cfg.context = cfg.context || _topWin;
		_isIE6 && (cfg.fixed = false);
		
		return new Dialog.fn.constructor(cfg);
	};
	
	Dialog.fn = Dialog.prototype = {
		
		version: '4.3.0',
		
		// ------------------------ private method -----------------------------
		constructor: function(cfg) {
			this.config 		= cfg;
			this.id 				= cfg.id;
			this.context 		= cfg.context;
			this.openerWindow  	= null;
			this.openerDialog  	= null;
			this.innerWindow   	= null;
			//this.innerDocument 	= null;
			
			this._contextDoc 	= cfg.context.document;
			this._container = cfg.container || this._contextDoc.body;
			this._zindex 		= 9999 || cfg.zindex;
			this._childList 	= []; // 存放子窗口
			this._unauthorized 	= false;
			this._maximized 	= false;
			this._closed 		= false;
			
			!this.DOM && (this.DOM = this._getDOM());
			this.htmlElement 	= this.DOM.wrap;
			
			var dom = this.DOM, _theme = '';
			
			// 通过 dialog.js?theme= 传递的主题样式
			if(_queryParam(_selfPath, 'theme')) {
				_theme += (' ' + _queryParam(_selfPath, 'theme'));
			}
			// 通过Dialog.open({"theme":""}) 传递的主题
			if(typeof(cfg.theme) == 'string') {
				_theme += (' ' + cfg.theme);
			}
				
			if(_theme !== '') {
				dom.outer.className += _theme;
			}
			
			if(cfg.closable) {
				dom.close.style.display = 'block';
			}
			
			if(cfg.maxable) {
				dom.max.style.display = 'block';
			}
			
			if(cfg.minable) {
				dom.min.style.display = 'block';
			}

			// 设置标题
			this.title(cfg.title);
			
			// 创建.confirm
			this.button.apply(this, cfg.button);

			// 计算main相对于wrap周围的间隙，用于准确计算main的尺寸:
			// main.w = W - 四周水平方向间隙 - 内部水平填充间隙
			// main.h = H - 四周竖直方向间隙 - 内部竖直填充间隙
			var wrapOffset = _offset(dom.wrap),
					mainOffset = _offset(dom.main);
			
			this._mainGaps = {
				'h_gap': (mainOffset.left - wrapOffset.left + wrapOffset.right - mainOffset.right),
				'v_gap': (mainOffset.top - wrapOffset.top + wrapOffset.bottom - mainOffset.bottom),
				'h_fill': (_int(_css.get(dom.main, 'paddingLeft'), 0) 
										+ _int(_css.get(dom.main, 'borderLeftWidth'), 0) 
										+ _int(_css.get(dom.main, 'paddingRight'), 0)
										+ _int(_css.get(dom.main, 'borderRightWidth'), 0)),
				'v_fill': (_int(_css.get(dom.main, 'paddingTop'), 0) 
										+ _int(_css.get(dom.main, 'borderTopWidth'), 0) 
										+ _int(_css.get(dom.main, 'paddingBottom'), 0)
										+ _int(_css.get(dom.main, 'borderBottomWidth'), 0))
			};
			
			this.size(cfg.width, cfg.height).resetPosition();
			
			if(cfg.url && typeof cfg.url === 'string' && cfg.url.length > 0) {
				var ifrm = this._iframe();
				ifrm.src = cfg.url;

				//暂时采用这种方式解决 iframe onload 被内页请求阻塞导致ownerDialog无法赋值问题。
				setTimeout((function(dlg, ifrm) {
					return function() {
						try {
							ifrm.contentWindow['ownerDialog'] = dlg;
							dlg.innerWindow = ifrm.contentWindow;
						} catch(e) {
							//ignore
						}
					};
				})(this, ifrm), 250);
			} 
			else {
				this.content(cfg.content);
			}
			
			cfg.modal && this._lock();
			
			// 置顶窗口
			this.focus();
			this._addEvent();
			
			try {
				_isFunc(cfg.onShow) && cfg.onShow.call(this);
			} catch(e){}
	
			this.openerWindow = root;
			root.ownerDialog && (this.openerDialog = root.ownerDialog);
			
			// 在窗口管理器中注册新的窗口对象
			_topWin['_idlg_list_'].unshift(this);
			
			// 如果当前窗口是从另外一个Dialog窗口内部弹出来，则作为父Dialog的子窗口
			if(this.openerDialog) {
				this.openerDialog._childList.unshift(this);
			}
		},

		_getDOM: function() {
			var cfg = this.config, dom = {},
				//$body = this._contextDoc.body,
				$body = this._container,
				$wrap = this._contextDoc.createElement('div');
			
			$wrap.style.cssText = 'position:'+ (cfg.fixed ? 'fixed' : 'absolute') +';left:0;top:0;padding:0 !important;margin:0 !important;border:0 none !important;';
			$wrap.className = 'idlg '+(cfg.uiStyle || '');
			$wrap.setAttribute('tabindex', -1);
			$wrap.setAttribute('role', 'dialog');
			//$body.insertBefore($wrap, $body.firstChild);
			$body.appendChild($wrap);
			
			$wrap.innerHTML = Dialog._tmpl.replace('{rs_tmpl}', cfg.resizable ? Dialog.rs_tmpl : '');
			
			var eles = $wrap.getElementsByTagName('*'), _class;
			for(var i = 0, len = eles.length; i < len; i++) {
				_class = eles[i].className;
				if(!_class || _class.indexOf('idlg-') === -1) {
					continue;
				}

				dom[_class.split('-')[1]] = eles[i];
			}
			
			dom.wrap = $wrap;
			return dom;
		},
		
		_iframe: function() {
			var dom = this.DOM,
				$content = dom.main,
				$iframe = dom.iframe;
				
			if($iframe) {
				return $iframe;
			}
			
			_innerHTML($content, Dialog.ifrm_tmpl, this.context);
			
			$iframe = dom.iframe = $content.getElementsByTagName('iframe')[0];
			dom.iframeCover = $content.getElementsByTagName('div')[0];

			var _iframeLoad = this.iframeLoad = (function(diag) { 
		   		return function(evt) {
						var frm = (evt||window.event).srcElement || (evt||window.event).target;
						try {
							//frm.contentWindow['ownerDialog'] = diag;
							//diag.innerWindow = frm.contentWindow;
							//diag.innerDocument = frm.contentWindow.document;
				
							// 自适应高度
							if(diag.config.height == 'auto'){
								var ch = _winSize(frm.contentWindow).sh;
								var _gaps = diag._mainGaps;
								// 总高度 = 内页高度 + 外围
								ch = ch + _gaps.v_gap + _gaps.v_fill;
								diag.size(diag.config.width, ch).resetPosition();
							}
				
						} catch(e) {
							diag._unauthorized = true;
						}
						
						try {
							_isFunc(diag.config.onLoad) && diag.config.onLoad.call(diag);
						} catch(e){}

						frm = null;
			   };
			   
			})(this);
			
			_EvtUtils.bind($iframe, 'load', _iframeLoad);
			
			return $iframe;
		},

		// 聚焦当前窗口
		focus: function() {
			var dom = this.DOM,
				$mask = this._mask(),
				focusDiag = _topWin._focusedIdlg,
				openerDiag = this.openerDialog,
				zindx = 0;
			
			if(this._childList.length == 0 && this !== focusDiag) {
				zindx = _topWin._idlgzIndex;
				dom.wrap.style.zIndex = zindx;
				this.config.modal && ($mask.style.zIndex = zindx - 1);
				_topWin._idlgzIndex += 2;
			}
			
			this.show();
			
			if(focusDiag && this !== focusDiag) {
				_css.remove(focusDiag.DOM.wrap, 'idlg-focus');
				_css.add(focusDiag.DOM.wrap, 'idlg-blur');
				focusDiag._toggleSelfMaskStyle(false);
				focusDiag.DOM.iframeCover && (focusDiag.DOM.iframeCover.style.display = 'block');
			}

			if(dom.iframeCover) {
				dom.iframeCover.style.display = 'none';
			}

			if(openerDiag && openerDiag.DOM.iframeCover) {
				openerDiag.DOM.iframeCover.style.display = 'none';
			}

			_css.remove(dom.wrap, 'idlg-blur');
			_css.add(dom.wrap, 'idlg-focus');
			this._toggleSelfMaskStyle(true);
			_topWin._focusedIdlg = this;
		},
		
		// 锁屏
		_lock: function() {
			this._mask().style.display = 'block';
			var ws = _winSize(this.context);
			if(ws.sh > ws.ch && this.config.fixed) { // has scrollbar
				_css.add(this._contextDoc.documentElement, 'idlg-lock');
			}
		},
		_unlock: function() {
			this._mask().style.display = 'none';
			this._mask().className = 'idlg-mask';
			_css.remove(this._contextDoc.documentElement, 'idlg-lock');
		},
		_toggleSelfMaskStyle: function(add) {
			// 支持临时性的遮罩层样式
			if(typeof this.config.modal !== 'string') {
				return;
			}
			
			add ? _css.add(this._mask(), this.config.modal) 
					: _css.remove(this._mask(), this.config.modal);
		},
		// 创建遮罩层
		_mask: function() {
			var _doc = this._contextDoc, 
					$mask = _doc.getElementById('_idlg_mask_');
				
			if($mask) {
				return $mask;
			}
			
			$mask = _doc.createElement('div');
			$mask.id = '_idlg_mask_';
			$mask.style.cssText = 'position:' + (_isIE6 ? 'absolute' : 'fixed') + ';left:0;top:0;right:0;bottom:0;z-index:1;width:100%;height:100%;overflow:hidden;';
			$mask.className = 'idlg-mask';
			
			if(_isIE6) {
				$mask.style.width = _winSize(this.context).sw + 'px';
				$mask.style.height = _winSize(this.context).sh + 'px';
			}
			
			_doc.body.appendChild($mask);

			if(this.config.fixed) {
				var sbarw = _scrollSize(this._contextDoc);
				_innerHTML($mask, '<style type="text/css">.idlg-lock body {border-right:'+ sbarw +'px solid transparent;}</style>', this.context);
			}
			
			$mask.onclick = function() {
				if(_topWin._focusedIdlg 
					&& _topWin._focusedIdlg.config.quickClosable === true) {
					_topWin._focusedIdlg.close();
				}
			};
			
			return $mask;
		},
		
		// 初始化窗口相关事件
		_addEvent: function() {
			var _this = this, 
				cfg = this.config,
				dom = this.DOM, 
				$wrap = dom.wrap, 
				_clickHandler,
				_mdownHandler;
			
			!this._eventCache && (this._eventCache = []);
			
			_clickHandler = _EvtUtils.add($wrap, 'click', function(evt) {
				var target = evt.srcElement || evt.target;
				
				// 有效的点击：idlg-min, idlg-max, idlg-close, idlg-btn
				while(!_css.has(target, 'idlg-min') && !_css.has(target, 'idlg-max')
							&& !_css.has(target, 'idlg-close') && !_css.has(target, 'idlg-btn')
							&& !_css.has(target, 'idlg')) {
						target = target.parentNode;
				}
				
				if(_css.has(target, 'idlg') || target.disabled) {
					return;
				}
				
				// close
				if(target === dom.close) {
					return !_isFunc(cfg.closeEvent) || cfg.closeEvent.call(_this) !== false 
									? _this.close() : _this;
				}
				// max
				else if(target === dom.max) {
					_this.maximize();
				}
				// min
				else if(target === dom.min) {
					_this.minimize();
				} 
				// dialog btns
				else if(_css.has(target, 'idlg-btn')) {
					var fn = _this._listeners[target.id] && _this._listeners[target.id].callback;
					return (typeof fn !== 'function' || fn.call(_this) !== false) 
								? _this.close() : _this;
				}
			});
			
			_mdownHandler = _EvtUtils.add($wrap, 'mousedown', function(evt) {
				_this.focus();	
			});
      
      //双击header最大化窗体
      if(cfg.maxable) {
        dom.header.ondblclick = function() {
          _this.maximize();
        };
      }
			
			this._eventCache.push(_clickHandler);
			this._eventCache.push(_mdownHandler);
		},
		
		// 清除窗口上注册的所有事件
		_removeEvent: function() {
			var _eventCache = this._eventCache;
			if(_eventCache && _eventCache.length > 0) {
				for(var i = _eventCache.length - 1; i >= 0 ; i--) {
					_EvtUtils.remove(_eventCache[i]);
				}
				
				this._eventCache = _eventCache = [];
			}
			
			if(this.DOM.iframe) {
				_EvtUtils.unbind(this.DOM.iframe, 'load', this.iframeLoad);
			}
		},
		
		// ------------------------ public method -----------------------------
		
		/**
		 * 设置或获取Dialog标题内容
		 * @param _title 新标题内容，可选
		 * @return 如果无参数，则返回Dialog标题内容；如果有参数，则返回当前Dialog对象本身
		 */
		title: function(_title) {
			var $title = this.DOM.title;
			
			if(_title === undefined) {
				return $title.innerHTML;
			}
			
			if(_title === false || _title === null) {
				$title.parentNode.style.display = 'none';
				return this;
			}
			
			if(typeof _title === 'string') {
				$title.parentNode.style.display = 'block';
				_innerHTML($title, _title, this.context);
				return this;
			} 
			
			if(_isFunc(_title)) {
				// 支持异步更新标题
				var asyncTitle = _title.call(this, (function(diag){ 
												return function(newTitle){
													diag.title(newTitle);
											 	};
									 		})(this));
				
				if(asyncTitle && typeof asyncTitle === 'string') {
					this.title(asyncTitle);
				};
			}
			return this;
		},
		
		/**
		 * 设置或获取Dialog显示的url地址
		 * @param _url {String}，可选
		 * @return 如果无参数，则返回当前的url地址；否则，加载给定的url。
		 */
		url: function(_url) {
			if(_url === undefined) {
				return this.config.url;
			}
			
			this.DOM.iframe && (this.DOM.iframe.src = _url);
			
			return this;
		},
		
		/**
		 * 设置或获取Dialog显示的内容
		 * @param _content {String, HTMLElement, Function}，可选
		 * @return 如果无参数且内容是url加载生成的，则返回url对应页面的window对象(非跨域下)；
		 * 		如果无参数且内容是静态内容，则返回静态内容本身；
		 * 		如果有参数，则返回当前Dialog对象本身
		 */
		content: function(_content) {
			if(_content === undefined) {
				if(this.config.url) {
					return this.innerWindow;
				}
				
				return this.config.content;
			}
			
			var _this = this, prev, next, pNode, display, asyncContent, 
				$content = this.DOM.main;
			
			_css.remove($content, 'scroll');
			
			if(this._elemBack) {
				this._elemBack();
				delete this._elemBack;
			}

			if(typeof _content === 'string') {
				_innerHTML($content, _content, this.context);
			} 
			else if(_isFunc(_content)) {
				// 支持异步更新内容
				asyncContent = _content.call(this, (function(diag){ 
													return function(newStr){
														diag.content(newStr);
												 	};
									 			})(this)
									 	);
				
				if(asyncContent && typeof asyncContent === 'string') {
					_innerHTML($content, asyncContent, this.context);
				};
			}
			// HTMLElement
			else if(_content && _content.nodeType === 1) {
				// 让传入的元素在窗口关闭后可以恢复到原来的地方
				display = _content.style.display;
				prev = _content.previousSibling;
				next = _content.nextSibling;
				pNode = _content.parentNode;
				
				this._elemBack = function() {
					if(prev && prev.parentNode) {
						prev.parentNode.insertBefore(_content, prev.nextSibling);
					} else if(next && next.parentNode) {
						next.parentNode.insertBefore(_content, next);
					} else if(pNode) {
						pNode.appendChild(_content);
					}
					_content.style.display = display;
					_this.elemBack = null;
				};
				
				$content.innerHTML = '';
				//$content.appendChild(_content);
				_innerHTML($content, _content.outerHTML, this.context);
				_content.style.display = 'block';
			}
			
			if(this.config.height == 'auto') {
				this.size(this.config.width, this.config.height);
			}
			
			this.resetPosition();
			
			return this;
		},
		
		/**
		 * 改变Dialog窗口大小
		 * @param w 窗口宽度
		 * @param h 窗口高度
		 * @return 当前Dialog对象本身
		 */
		size: function(w, h) {
			var _w = w, _h = h, iw = 'auto', ih = 'auto';
			
			var dom = this.DOM, _gaps = this._mainGaps, ws = _winSize(this.context);
		
			// 计算百分数
			var pReg = /^\d+(\.\d+)?%$/;
			if(pReg.test(_w)) {
				_w = ws.cw * parseFloat(_w) * 0.01;
			} else if(/^\d+/.test(_w)) {
				_w = _int(_w, 0);
			} else {
				if(dom.main.offsetWidth + _gaps.h_gap > ws.cw) {
					_w = ws.cw;
					_css.add(dom.main, 'scroll');
				}
			}
			
			if(pReg.test(_h)) {
				_h = ws.ch * parseFloat(_h) * 0.01;
			} else if(/^\d+/.test(_h)) {
				_h = _int(_h, 0);
			} else {
				if(dom.main.offsetHeight + _gaps.v_gap > ws.ch) {
					_h = ws.ch;
					_css.add(dom.main, 'scroll');
				}
			}
	
			// 计算内容区域的宽度和高度
			if(!isNaN(_w)) {
				_w = Math.min(_int(_w, 0), ws.cw);
				iw = (_w - _gaps.h_gap - _gaps.h_fill) + 'px';
				dom.wrap.style.width = _w + 'px';
			}

			if(!isNaN(_h)) {
				_h = Math.min(_int(_h, 0), ws.ch);
				ih = (_h - _gaps.v_gap - _gaps.v_fill) + 'px';
			}
			
			dom.main.style.width = iw;
			dom.main.style.height = ih;
			
			if(dom.iframe) {
				dom.iframe.style.width = iw;
				dom.iframe.style.height = ih;
			}
			
			this.config.width = w;
			this.config.height = h;
			
			return this;
		},
		
		/**
		 * 窗口显示位置
		 */
		position: function(_left, _top) {
			var reg = /^\d+(\.\d+)?%$/,
				cfg = this.config,
				$wrap = this.DOM.wrap,
				_fixed = cfg.fixed,
				ws = _winSize(this.context),
				dl = _fixed ? 0 : ws.sl,
				dt = _fixed ? 0 : ws.st;
      
			_left = _left === undefined ? cfg.left : _left;
			_top = _top === undefined ? cfg.top : _top;
			
			cfg.left = _left;
			cfg.top = _top;
			
			if (reg.test(_left)) {
	      _left = (ws.cw - $wrap.offsetWidth) * parseFloat(_left) * 0.01 + dl;
				_left = Math.max(parseInt(_left), dl);
	    }
		
	    if(reg.test(_top)) {
				_top = (ws.ch - $wrap.offsetHeight) * parseFloat(_top) * 0.01 + dt;
				_top = Math.max(parseInt(_top), dt);
	    }

	    $wrap.style.left = _left + 'px';
	    $wrap.style.top = _top + 'px';
			
			return this;
		},
		
		/**
		 * 重新调整当前窗口的显示位置
		 */
		resetPosition: function () {
      // 如果窗口已经最最大化了
      if(this._maximized) {
        this.position(0, 0);
        this.size(99999, 99999);
        return this;
      }
      
			var _follow = this.config.follow || this._follow;
			_follow && _follow['target'] ? this.follow(_follow['target'], _follow['placement']) : this.position();
      
      return this;
		},
		
		/**
		 * 显示当前Dialog窗口
		 * 和 hide() 方法配合使用
		 */
		show: function() {
			this.DOM.wrap.style.display = 'block';
			_css.add(this.DOM.wrap, 'idlg-show');
			this.DOM.wrap.focus();
			return this;
		},
		
		/**
		 * 隐藏当前Dialog窗口
		 * 和 close() 区别是：hide() 是暂时不显示
		 */
		hide: function() {
			this.DOM.wrap.style.display = 'none';
			_css.remove(this.DOM.wrap, 'idlg-show');
			return this;
		},
		
		/**
		 * 跟随元素
		 * @param {HTMLElement}, placement = top|bottom|left|right
		 */
		follow: function (elem, placement) {
			// 隐藏元素不可用
			if (!elem || !elem.offsetWidth && !elem.offsetHeight) {
				return this.position();
			};
			
			this.config.dragable = false;
			this.config.resizable = false;
			
			placement = (/^\s*(top|bottom|left|right)\s*$/gi.test(placement) ? placement : 'bottom').toLowerCase();

			var fixed = false,
				dom = this.DOM,
				ws = _winSize(this.context),
				winWidth = ws.cw,
				winHeight = ws.ch,
				docLeft =  ws.sl,
				docTop = ws.st,
				
				offset = _offset(elem),
				elemWidth = elem.offsetWidth,
				elemHeight = elem.offsetHeight,
				
				left = fixed ? offset.left - docLeft : offset.left,
				top = fixed ? offset.top - docTop : offset.top,
				
				wrapWidth = dom.wrap.offsetWidth,
				wrapHeight = dom.wrap.offsetHeight,
				
				setLeft = 0,
				setTop = 0,
				
				dl = fixed ? 0 : docLeft,
				dt = fixed ? 0 : docTop;

			dom.arw.style.display = 'block';
			var arrLeft = 10, arrTop = 10, 
				arrType = '';
			
			if('left' == placement || 'right' == placement) {
				dom.arw.className = 'idlg-arw at-lft';
				var arrW = dom.arw.offsetWidth, arrH = dom.arw.offsetHeight;
				var _lft = left + dl - (wrapWidth + arrW), 
						_rgt = (left + elemWidth) + arrW;
					
				setTop = Math.max(dt, top + elemHeight/2 - wrapHeight/2);
				if(setTop + wrapHeight > winHeight + dt) {
					setTop = winHeight + dt - wrapHeight;
				}
				arrTop = top + elemHeight/2 - setTop;
				//修正arrTop的值，不能超出当前Dialog的范围
				if(arrTop <= arrH * 0.5) { arrTop = arrH * 0.5 + 4; }
				if(arrTop + arrH >= wrapHeight) { arrTop = wrapHeight - arrH - 4; }
					
				switch(placement) {
					case 'left':
						setLeft = _lft;
						arrType = 'rgt';
						if(_rgt + wrapWidth <= winWidth) {
							setLeft = _rgt;
							arrType = 'lft';
						}
					break;
					case 'right':
						setLeft = _rgt;
						arrType = 'lft';
						if(_rgt + wrapWidth > winWidth && _lft >= 0) {
							setLeft = _lft;
							arrType = 'rgt';
						}
					break;
				};
				
				dom.arw.className = 'idlg-arw at-'+ arrType;
				dom.arw.style.top = parseInt(arrTop - arrH * 0.5) + 'px';
			} else {
				dom.arw.className = 'idlg-arw at-top';
				var arrW = dom.arw.offsetWidth, arrH = dom.arw.offsetHeight;
				setLeft = left - (wrapWidth - elemWidth) * 0.5;
				if(setLeft < dl) {
					setLeft = left;
					arrLeft = elemWidth * 0.5;
				} else if((setLeft + wrapWidth > winWidth) && (left - wrapWidth > dl)) {
					setLeft = left + elemWidth - wrapWidth;	
					arrLeft = wrapWidth - elemWidth * 0.5;
				} else {
					setLeft = setLeft;
					arrLeft = wrapWidth * 0.5;
				}
				//修正 arrLeft 的值，不能超出当前Dialog的范围
				if(arrLeft <= arrW * 0.5) { arrLeft = arrW * 0.5 + 4; }
				if(arrLeft + arrW >= wrapWidth) { arrLeft = wrapWidth - arrW - 4; }
				
				switch(placement) {
					case 'top':
						setTop = top - wrapHeight - arrH;
						arrType = 'btm';
						if(setTop - dt < 0) {
							setTop = top + elemHeight + arrH;
							arrType = 'top';
						}
					break;
					case 'bottom':
						setTop = top + elemHeight + arrH;
						arrType = 'top';
						if((setTop + wrapHeight > winHeight + dt) && (top - wrapHeight > dt)) {
							setTop = top - wrapHeight - arrH;
							arrType = 'btm';
						}
					break;
				};
				
				dom.arw.className = 'idlg-arw at-'+ arrType;
				dom.arw.style.left = parseInt(arrLeft - arrW * 0.5) + 'px';
			}		

			dom.wrap.style.position = 'absolute';
			dom.wrap.style.left = parseInt(setLeft) + 'px';
			dom.wrap.style.top = parseInt(setTop) + 'px';
			
			this._follow = {'target': elem, 'placement': placement};
		
			return this;
		},
		
		/**
		 * 创建按钮
		 * @example button({
		 * id: '',
		 * label: 'login',
		 * click: function () {},
		 * disabled: false,
		 * focus: true,
		 * intent: 'primary|success|warning|danger'
		 * }, .., ..)
		 */
		button: function() {
			var args = [].slice.call(arguments);
		
			if(args.length == 0) {
				return;
			}
			
			var doc = this._contextDoc,
				docfrag = doc.createDocumentFragment(),
				dom = this.DOM,
				listeners = this._listeners = this._listeners || {},
				i = args.length - 1, arg, id, isNewBtn, btn;	
			
			for(; i >= 0; i--) {
				arg = args[i];
				id = arg.id || 'idlg_btn_'+ (+ new Date()) + '_' + i;
				isNewBtn = !listeners[id];
		
				btn = !isNewBtn ? listeners[id].elem : doc.createElement('a');
				btn.setAttribute('href', 'javascript:;');
				btn.id = id;
				
				if(btn.disabled) {
					btn.className = 'idlg-btn idlg-btn-dis';
				} else {
					btn.className = ('idlg-btn '+ (arg.intent?(' idlg-btn-intent-'+ arg.intent):'') + (arg.focus?' idlg-btn-focus':'') );
				}
				
				btn.innerHTML = ('<span class="idlg-btn-txt">'+ arg.label + '</span>');
				btn.disabled = !!arg.disabled;

				if(!listeners[id]) {
					listeners[id] = {};
				}
				
				if(arg.click) {
					listeners[id].callback = arg.click;
				}
				
				if(isNewBtn) {
					listeners[id].elem = btn;
					docfrag.appendChild(btn);
				}
			}
			
			dom.btns.appendChild(docfrag);
			dom.footer.style.display = 'block';
			docfrag = null;
			
			return this;
		},
		
		/**
		 * 关闭当前Dialog窗口对象
		 */
		close: function() {
			
			if(this._closed) {
				return;
			}
			
			// 从窗口管理器中移除当前窗口对象
			removeDiag(_topWin['_idlg_list_'], this);
			
			var cfg = this.config, 
				hideMask = true, 
				$mask = this._mask(), 
				leftDiags = _topWin['_idlg_list_'],
				$wrap = null;
			
		    /*if(this._unauthorized === false) {
			  	if(this.innerWindow && this.innerWindow.Dialog && 
			  			this.innerWindow.Dialog._childList.length > 0) {
			  		return;
			  	}
				}*/
			
			// 移除临时性的遮罩层样式
			this._toggleSelfMaskStyle(false);

			// 先关闭可能存在的所有子窗口
			for(var i = 0, len = this._childList.length; i < len; i++) {
				this._childList.shift().close();
			}
			
			// 如果定义了窗口关闭后要执行的事件
	    if(_isFunc(cfg.onClosed)) {
	    	cfg.onClosed.call(this);
	    }
		
			// 将遮罩层交给后面一个需要的窗口
			for(var i = 0, len = leftDiags.length; i < len; i++) {
				var dlg = leftDiags[i];
				if(dlg.config.modal) {
					dlg._toggleSelfMaskStyle(true);
					$mask.style.zIndex = _int(dlg.DOM.wrap.style.zIndex, 1) - 1;
					hideMask = false;
					break;
				}
			}
			// 如果没有dialog需要mask的，则隐藏mask
		  hideMask && this._unlock();
			
			// 将窗口管理中下一个窗口激活为当前顶层窗口
			_topWin._focusedIdlg = leftDiags.length > 0 ? leftDiags[0] : null;
			_topWin._focusedIdlg && _topWin._focusedIdlg.focus();

			this._closed = true;
		    
			$wrap = this.DOM.wrap;
			$wrap.style.display = 'none';
			
			this._removeEvent();
			
			if(this._elemBack) {
			   this._elemBack();
			}
			
			if(this._listeners) {
				for(var j in this._listeners) {
					this._listeners[j] = null;
					delete this._listeners[j];
				}
				this._listeners = null;
			}
			
			/* 对于iframe，这样的额外处理并不会进行垃圾回收
			if(cfg.url) {
				this.DOM.iframe.src = 'about:blank';
				this.DOM.iframe.parentNode.innerHTML = '&nbsp;';
			}*/
      
      if(cfg.maxable) {
        this.DOM.header.ondblclick = null; 
      }
			
			for(var d in this.DOM){
				this.DOM[d] = null;
				delete this.DOM[d];
			}
			
			this.DOM = null;
			this.context = null;
			this.openerWindow  = null;
			this.openerDialog  = null;
			if(this.innerWindow) {
				this.innerWindow.ownerDialog && (this.innerWindow.ownerDialog = null);
				this.innerWindow = null;
			}
			//this.innerDocument = null;
			this._contextDoc = null;
			this._container = null;
			this._childList = [];
			this.htmlElement = null;

			$wrap.parentNode.removeChild($wrap);
			
			cfg = hideMask = $mask = leftDiags = $wrap = null;
			
			// IE下强制执行垃圾回收
		  doc.all && CollectGarbage();
		},
		
		/**
		 * 最大化窗口
		 */
		maximize: function() {
			if(!this.config.maxable) {
				return this;
			}
			
			if(_isFunc(this.config.maximizeEvent) 
				&& this.config.maximizeEvent.call(this) === false) {
				return this;
			}
			
			var cfg = this.config, 
				$wrap = this.DOM.wrap;
			// 还原窗口
			if(this._maximized === true) {
				this._maximized = false;
				this.size(this._ow, this._oh).position(this._olft, this._otop);
				this.DOM.max.className = 'idlg-max';
				_css.remove(this.DOM.wrap, 'idlg-maxed');
			} else {
				this._maximized = true;
				this._ow = cfg.width;
				this._oh = cfg.height;
				this._olft = _int($wrap.style.left, 0);
				this._otop = _int($wrap.style.top, 0);
				$wrap.style.left = 0;
				$wrap.style.top = 0;
				this.size(99999, 99999);
				this.DOM.max.className = 'idlg-max idlg-restore';
				_css.add(this.DOM.wrap, 'idlg-maxed');
			}
			
			return this;
		},
		
		/**
		 * 最小化窗口
		 */
		minimize: function() {			
			if(!this.config.minable) {
				return this;
			}
			
			if(_isFunc(this.config.minimizeEvent)
				&& this.config.minimizeEvent.call(this) === false) {
				return this;
			}
			
			var dom = this.DOM;
			if(this._minimized === true) {
				this._minimized = false;
				dom.main.style.display = 'block';
				dom.footer.style.display = 'block';
				_css.remove(this.DOM.wrap, 'idlg-mined');
			} else {
				this._minimized = true;
				dom.main.style.display = 'none';
				dom.footer.style.display = 'none';
				_css.add(this.DOM.wrap, 'idlg-mined');
			}

			return this;
		}
		
	};
	
	
	Dialog.fn.constructor.prototype = Dialog.fn;
	
	_topWin['_idlg_list_'] = _topWin['_idlg_list_'] || [];
	_topWin._focusedIdlg = _topWin._focusedIdlg || null;
	_topWin._idlgzIndex = _topWin._idlgzIndex || 9999;
	
	function removeDiag(arr, diag) {
		for(var i = 0, len = arr.length; i < len; i++) {
			if( diag == arr[i] ){
				arr[i] = null;
				arr.splice(i, 1);
				break;
			}
		}
	}

	//----------------------------------------------------------------------------
	// Dialog对话框 拖曳(drag, resize)支持 (可选外部模块)
	//----------------------------------------------------------------------------
	var _dragEvent = null, _dragInit = null, 
		_isLosecapture = 'onlosecapture' in doc.documentElement,
		_isSetCapture = 'setCapture' in doc.documentElement;
	
	Dialog._dragEvent = function() {
		var that = this,
				proxy = function(name) {
					var fn = that[name];
					that[name] = function() {
						return fn.apply(that, arguments);
					};
				};
		
		proxy('start');
		proxy('move');
		proxy('end');
	};
	
	Dialog._dragEvent.prototype = {
		onstart: function(){},
		start: function(evt) {
			this._sClientX = evt.pageX;
			this._sClientY = evt.pageY;
			_EvtUtils.bind(doc, 'mousemove', this.move);
			_EvtUtils.bind(doc, 'mouseup', this.end);
			this.onstart(this._sClientX, this._sClientY);
			return false;
		},
		
		onmove: function(){},
		move: function(evt) {
			evt = _EvtUtils.fix(evt);
			this.onmove(evt.pageX - this._sClientX, evt.pageY - this._sClientY);
			return false;
		},
		
		onend: function(){},
		end: function(evt) {
			evt = _EvtUtils.fix(evt);
			_EvtUtils.unbind(doc, 'mousemove', this.move);
			_EvtUtils.unbind(doc, 'mouseup', this.end);
			this.onend(evt.pageX, evt.pageY);
			return false;
		}
	};
	
	// Dialog drag init
	_dragInit = function(evt) {
		var diag = root._focusedIdlg,
			dom = diag.DOM,
			$wrap = dom.wrap,
			wrapStyle = $wrap.style,
			$title = dom.title,
			$cover = dom.iframeCover,
			target = evt.srcElement || evt.target, 
			targetCls = target.className;
		
		var _isResize = (targetCls && /(\s+|^)idlg-(s|n|w|e|nw|ne|sw|se)(\s+|$)/.test(targetCls));
		var startWidth = 0, startHeight = 0, startLeft = 0, startTop = 0, limit = {};
		
		_dragEvent.onstart = function(x, y) {
			if(_isResize) {
				startWidth = $wrap.offsetWidth;
				startHeight = $wrap.offsetHeight;
			}
			
			startLeft = _int(wrapStyle.left, 0);
			startTop = _int(wrapStyle.top, 0);
			
			!_isIE6 && (_isLosecapture ? _EvtUtils.bind($title, 'losecapture', _dragEvent.end) 
									 : _EvtUtils.bind(root, 'blur', _dragEvent.end));
			
			_isSetCapture && $title.setCapture();
			
			$cover && ($cover.style.display = 'block');
		};
		
		_dragEvent.onmove = function(x, y) {
			if(_isResize) {
				var pos = {"width": startWidth, "height": startHeight, 
							"left": _int(wrapStyle.left, 0), "top": _int(wrapStyle.top, 0)};

				if(targetCls.indexOf("e") != -1) {
					pos.width = Math.max(Dialog.defaults._resize.minWidth, startWidth + x);
				}
				if(targetCls.indexOf("s") != -1) {
					pos.height = Math.max(Dialog.defaults._resize.minHeight, startHeight + y);
				}
				if(targetCls.indexOf("w") != -1) {
					pos.width = Math.max(Dialog.defaults._resize.minWidth, startWidth - x);
					pos.left = Math.max(0, startLeft + startWidth - pos.width);
				}	
				if(targetCls.indexOf("n") != -1) {
					pos.height = Math.max(Dialog.defaults._resize.minHeight, startHeight - y);
					pos.top = Math.max(0, startTop + startHeight - pos.height);
				}
				
				wrapStyle.left = pos.left +'px';
				wrapStyle.top = pos.top +'px';
				
				diag.size(pos.width, pos.height);
				
				if(_isFunc(diag.config.onResize)) {
					diag.config.onResize.call(this, pos);
				}
				
			} else {
				var	nLeft = Math.max(limit.minX, Math.min(limit.maxX, x + startLeft)),
						nTop = Math.max(limit.minY, Math.min(limit.maxY, y + startTop));
				
				wrapStyle.left = nLeft + 'px';
				wrapStyle.top = nTop + 'px';
				
				if(_isFunc(diag.config.onDrag)) {
					diag.config.onDrag.call(this, {'left': nLeft, 'top': nTop});
				}
			}
		};
		
		_dragEvent.onend = function(x, y) {
			diag.config.left = _int(wrapStyle.left, 0);
			diag.config.top = _int(wrapStyle.top, 0);
			$cover && ($cover.style.display = 'none');
			
			!_isIE6 && _isLosecapture 
					? _EvtUtils.unbind($title, 'losecapture', _dragEvent.end)
					: _EvtUtils.unbind(root, 'blur', _dragEvent.end);
					
			_isSetCapture && $title.releaseCapture();
		};
		
		limit = (function() {
			var ws = _winSize(diag.context),
				maxX = 0, maxY = 0,
				fixed = ($wrap.style.position === 'fixed'),
				ow = $wrap.offsetWidth,
				oh = $wrap.offsetHeight,
				ww = ws.cw,
				wh = ws.ch,
				dl = fixed ? 0 : ws.sl,
				dt = fixed ? 0 : ws.st;
			
			// 坐标最大限制
			maxX = ww - ow + dl;
			maxY = wh - oh + dt;
			
			return {
				"minX": dl,
				"minY": dt,
				"maxX": maxX,
				"maxY": maxY,
				"sl": ws.scrollLeft,
				"st": ws.scrollTop
			};
		})();
		
		_dragEvent.start(evt);
	};
	
	function _dragHandler(evt) {
		var dlg = root._focusedIdlg;
		if(!dlg) {
			return false;
		}
		
		if(!dlg.config.dragable && !dlg.config.resizable || dlg._maximized) {
			return false;
		}
		
		var _evt = _EvtUtils.fix(evt), target = _evt.target;
		
		while(target) {
			if(target.className && /(\s+|^)idlg-(header|s|n|w|e|nw|ne|sw|se)(\s+|$)/.test(target.className)) {
				break;
			}
			if(target === dlg.DOM.wrap || (target.nodeType === 1 && target.tagName === 'BODY')) {
				target = null;
				break;
			}
			target = target.parentNode;
		};
		
		if(target) {
			_dragEvent = _dragEvent || new Dialog._dragEvent();
			_dragInit(_evt);
			_EvtUtils.stop(evt);
			// 防止firefox与chrome滚屏
			return false; 
		};
	};
	
	// 代理 mousedown 事件触发对话框拖动
	_EvtUtils.unbind(document, 'mousedown', _dragHandler);
	_EvtUtils.bind(document, 'mousedown', _dragHandler);
	
	//---------------------------------- drag end -------------------------------
	
	
	//------------------------------------------------------------
	// 静态方法
	//------------------------------------------------------------
	
	/**
	 * 打开一个新窗口
	 * @return 返回新打开的窗口对象
	 */
	Dialog.open = function(config) {
		var dlg = Dialog(config);
		return dlg;
	};
	
	/**
	 * 根据窗口唯一标识ID获取窗口Dialog对象
	 * @param id 窗口唯一标识ID
	 * @return 如果id为空，则返回当前活动的窗口Dialog对象；否则返回指定ID的窗口Dialog对象
	 */
	Dialog.get = function(id, win) {
		if(id === undefined) {
			return _topWin._focusedIdlg;
		}
		
		for(var i = 0, len = _topWin['_idlg_list_'].length; i < len; i++) {
			if(_topWin['_idlg_list_'][i].id === id) {
				return _topWin['_idlg_list_'][i];
			}
		}
		
		return null;
	};	
	
	/**
	 * 用于窗口内子页面获取当前所在窗口的触发来源页面window对象
	 * 即：当前窗口是从哪个页面上弹出来的
	 * @return 触发页面的window对象
	 */
	Dialog.openerWindow = function() {
		return root.ownerDialog ? root.ownerDialog.openerWindow : null;
	};
	
	/**
	 * 用于窗口内子页面获取当前所在窗口的父窗口Dialog对象
	 * 即：当前窗口是从哪个Dialog窗口中弹出来的
	 * @return 触发窗口的Dialog对象
	 */
	Dialog.openerDialog = function() {
		var op_win = Dialog.openerWindow();
		if( op_win && op_win.ownerDialog ){
			return op_win.ownerDialog;
		}else{
			return null;
		};
	};
	
	/**
	 * 用于窗口内子页面获取当前所在窗口Dialog对象
	 * @return 当前所在窗口的Dialog对象
	 */
	Dialog.ownerDialog = function() {
		console.log(window.ownerDialog);
		return root.ownerDialog || null;
	};
	
	/**
	 * 关闭窗口
	 * @param id 窗口唯一标识ID，如果参数为空，则关闭当前活动的窗口；否则关闭ID指定的窗口
	 */
	Dialog.close = function(id, win) {
		if(id === undefined) {
			root.ownerDialog.close();
		} 
		else if(Dialog.get(id, win)){
			Dialog.get(id, win).close();
		}
	};
	
	/** 
	 * alert 提示框
	 * @param msg 提示内容，支持html元素
	 * @param okFunc 点击“确定”后执行的回调函数，可选
	 * @param config  提示框的特性设定，支持：title, width, dragable, yesLabel, type(info, warning, success, error)
	 */
	Dialog.alert = function(msg, okFunc, config) {
		var cfg = config || {};
		var icon_type = cfg.alertIcon || ('icon-'+ (cfg.type || 'info'));
		var btns = [{label: cfg.yesLabel || Dialog.defaults.alert.yesLabel, focus: true, intent: cfg.yesStyle||'primary', click: okFunc}];
		var title = cfg.title || Dialog.defaults.alert.title;
		
		cfg.title =  false;
		cfg.width = cfg.width || 'auto';
		cfg.height = cfg.height || 'auto';
		cfg.url = false;
		cfg.closable = false;
		cfg.resizable = false;
		cfg.maxable = false;
		cfg.minable = false;
		cfg.modal = true;
		cfg.theme = 'idlg-alert ' + (cfg.theme || '');
		cfg.content = '<div class="alert-wrapper">'
										+'<div class="alert-icon '+ icon_type +'"></div>'
										+'<div class="alert-content">'
											+(title ? ('<div class="alert-title">'+ title +'</div>') : '')
											+'<div class="alert-msg">'+ msg +'</div>'
										+'</div>'
									+'</div>';
		
		cfg.button = btns.concat(cfg.button || []);
		
		return Dialog.open(cfg);
	};
	
	/**
	 * confirm 确认框
	 * @param content 提示内容，支持html元素
	 * @param yesFunc 点击“是”后执行的回调函数，可选
	 * @param noFunc 点击“否”后执行的回调函数，可选
	 * @config 提示框特性设置项，支持：width, height, title, yesLabel, noLabel, showCancel, follow 
	 */
	Dialog.confirm = function(content, yesFunc, noFunc, config) {
		var cfg = config || {};
		cfg.type = cfg.type || 'warning'; 
		cfg.title = cfg.title || Dialog.defaults.confirm.title;
		cfg.yesLabel = cfg.yesLabel || Dialog.defaults.confirm.yesLabel;

		var btns = [{label: cfg.noLabel || Dialog.defaults.confirm.noLabel, intent: cfg.noStyle||false, click: noFunc }];
		cfg.button = btns.concat(cfg.button || []);
		
		return Dialog.alert(content, yesFunc, cfg);
	};
	
	Dialog.success = function(content, okFunc, config) {
		config = config || {};
		config.type = 'success';
		config.title = config.title || '成功';
		config.yesStyle = config.yesStyle || 'success';

		return Dialog.alert(content, okFunc, config);
	};
	
	Dialog.warning = function(content, okFunc, config) {
		config = config || {};
		config.type = 'warning';
		config.title = config.title || '警告';
		config.yesStyle = config.yesStyle || 'warning';

		return Dialog.alert(content, okFunc, config);
	};
	
	Dialog.error = function(content, okFunc, config) {
		config = config || {};
		config.type = 'error';
		config.title = config.title || '错误';
		config.yesStyle = config.yesStyle || 'danger';

		return Dialog.alert(content, okFunc, config);
	};

	/**
	 * Toaster 通知提示
	 */
	function Toaster(msg, opts, container) {
		var _opts = this.opts = opts || {};
		//指定Toast显示的容器
		this.container = container || document.body;
		//消息内容
		this.msg = msg || '';
		//设定自动关闭的超时时间，如果 <=0 则禁用自动关闭功能
		this.timeout = isNaN(_opts.timeout) ? Toaster.defaults.timeout : parseInt(_opts.timeout);
		//是否自动聚焦，如果自动聚焦，则自动关闭功能会暂时取消，当失去焦点时，自动关闭功能重新开启
		this.autoFocus = typeof _opts.autoFocus === 'undefined' ? Toaster.defaults.autoFocus : _opts.autoFocus;
		//当Toast关闭后，执行的回调函数
		this.onDismiss = typeof _opts.onDismiss === 'function' ? _opts.onDismiss : function() {};
		
		//自定关闭定时器
		this._timer = null;
		//标识关闭是否已经开始
		this._closed = false;
		//相关DOM对象，便于后续操作
		this._eles = {};

		if('loading' == _opts.intent) {
			this.timeout = 0;
		}

		this._create();
	};

	Toaster.prototype._create = function() {
		if(this._eles.$ele) {
			return;
		}

		var _opts = this.opts;
		var ele = this._eles.$ele = document.createElement('div');
		ele.className = 'idlg-toast'+ (_opts.intent ? ' idlg-toast-intent-'+ _opts.intent : '');
		ele.innerHTML = '<span class="idlg-toast-icon '+ (_opts.iconClass||'') +'"></span>'+
											'<div class="idlg-toast-btns"><button class="idlg-toast-close" title="点击立刻关闭">×</button></div>'+
											'<div class="idlg-toast-msg"></div>';
		
		this.autoFocus && ele.setAttribute("tabindex", 0);

		ele.onfocus = ele.onmouseenter = (function(_this) {
			return function() {
				_this._cancelTimeout();
			};
		})(this);

		ele.onblur = ele.onmouseleave = (function(_this) {
			return function() {
				_this._startTimeout();
			};
		})(this);

		ele.onclick = (function(_this) {
			return function(evt) {
				var target = (evt||window.event).srcElement || (evt||window.event).target;
				if(_css.has(target, 'idlg-toast-close')) {
					_this.dismiss();
					return;
				}
				//other click target	
			};
		})(this);

		var childEles = ele.getElementsByTagName('*');
		for(var i = 0, len = childEles.length; i < len; i++) {
			var _child = childEles[i], clsName = _child.className;
			if(clsName.indexOf('idlg-toast-msg') != -1) {
				this._eles.$msg = _child;
			} else if(clsName.indexOf('idlg-toast-btns') != -1) {
				this._eles.$btnGroup = _child;
			} /*else if(clsName.indexOf('idlg-toast-icon') != -1) {
				this._eles.$icon = _child;
			}*/
		}

		this.container.insertBefore(ele, this.container.firstChild);
		this.message(this.msg);
		
		if(this.autoFocus) {
			this._eles.$ele.focus();
		} else {
			this._startTimeout();
		}
	};

	Toaster.prototype._startTimeout = function() {
		if(this.timeout <= 0) {
			return;
		}

		(!this._timer) && (this._timer = setTimeout((function(_this) {
			return function() {
				_this.dismiss();
			};
		})(this), this.timeout));
	};

	Toaster.prototype._cancelTimeout = function() {
		if(this._timer) {
			clearTimeout(this._timer);
			this._timer = null;
		}
	};

	/**
	 * 修改Toast内容
	 */
	Toaster.prototype.message = function(msg) {
		this._cancelTimeout();
		this._eles.$msg.innerHTML = msg || '';
		this._startTimeout();
	};

	/**
	 * 关闭Toast
	 */
	Toaster.prototype.dismiss = function() {
		if(this._closed) {
			return;
		}
		
		this._closed = true;

		if(this._timer) {
			clearTimeout(this._timer);
			this._timer = null;
		}

		//销毁并清理内容
		var $ele = this._eles.$ele;
		$ele.onmouseenter = null;
		$ele.onmouseleave = null;
		$ele.onclick = null;
		$ele.onfocus = null;
		$ele.onblur= null;
		$ele.parentNode.removeChild($ele);
		this._eles = {};

		try {
			//执行回调函数
			this.onDismiss();
		} catch(e) {
			console && console.error(e);
		}
	};

	Toaster.defaults = {
		timeout: 5000,
		autoFocus: false
	};

	/**
	 * 静态方法，封装Toaster调用。
	 * @param msg 消息内容
	 * @param opts 配置选项{intent:'primary|success|warning|danger|dark|loading', 
	 * 											timeout: 毫秒,
	 * 											onDismiss: function() {},
	 * 											position: 'top_left|top_center|top_right|bottom_left|bottom_center|bottom_right',
	 * 											iconClass: ''
	 * 										}
	 * @return 返回 Toaster对象，可以调用对象的方法：xxx.message("新消息内容"); xxx.dismiss()--关闭toast。
	 */
	Dialog.toast = function(msg, opts) {
		var container = Dialog.__toastContainer;
		if(!container) {
			container = Dialog.__toastContainer = doc.createElement('div');
			container.className = 'idlg-toast-container';
			doc.body.appendChild(container);
		}

		var _opts = opts || {};
		if(_opts.position) {
			container.className = 'idlg-toast-container '+ String(_opts.position).toLowerCase();
		}
		container.style.display = 'block';

		//组合内置的dimiss处理：如果所有Toast都销毁了，则自动隐藏其所在的容器。
		_opts.onDismiss = (function(container, _onDismiss) {
			return function() {
				// 当没有toast时隐藏容器
				(container.children.length == 0) && (container.style.display = 'none');

				if(_isFunc(_onDismiss)) { 
					try{
						_onDismiss();
					}catch(e){
						console && console.error(e);
					}
				}
			};
		})(container, _opts.onDismiss);

		var toaster = new Toaster(msg, _opts, container);
		return toaster;
	};
	
	//-----------------------------------------------------------------------------------------
	
	// 全局快捷键
	_EvtUtils.bind(document, 'keydown', function (evt) {
		var target = evt.srcElement || evt.target,
			nodeName = target.nodeName,
			rinput = /^input|textarea$/i,
			focusDiag = _topWin._focusedIdlg,
			keyCode = evt.keyCode;
			
		if(!focusDiag || rinput.test(nodeName)) {
			return;
		}
		
		// ESC
		if(keyCode === 27) {
			focusDiag.close();
			return;
		}
		
		// Enter, <-, ->
		if(keyCode !== 13 && keyCode !== 37 && keyCode !== 39) {
			return;
		}
		
		var btns = focusDiag.DOM.btns && focusDiag.DOM.btns.getElementsByTagName('a');
		if(!btns || btns.length == 0) {
			return;
		}
		
		var len = btns.length, focusIndx = -1, prevIndx = -1;
		for(var i = 0; i < len; ++i) {
			if(_css.has(btns[i], 'idlg-btn-focus')){
				focusIndx = i;
				break;
			}
		}
		
		_EvtUtils.stop(evt);
		
		// Enter
		if(keyCode === 13) {
			var btnId = btns[focusIndx].getAttribute('id');
			var fn = focusDiag._listeners[btnId] && focusDiag._listeners[btnId].callback;
			(typeof fn !== 'function' || fn.call(focusDiag) !== false) && focusDiag.close();
		}
		
		// <-- -->
		if((keyCode === 37 || keyCode === 39) && len > 1) {
		
			if(keyCode === 37) {
				if(focusIndx <= 0) {
					focusIndx = len - 1;
					prevIndx = 0;
				} else {
					prevIndx = focusIndx;
					focusIndx = Math.max(--focusIndx, 0);
				}
			}
			else if(keyCode === 39) {
				if(focusIndx < 0) {
					focusIndx = prevIndx = 0;
				} 
				else if(focusIndx == len-1) {
					prevIndx = focusIndx;
					focusIndx = 0;
				} else {
					prevIndx = focusIndx;
					focusIndx = Math.min(++focusIndx, len-1);
				}
			}
			
			if(!btns[focusIndx].disabled) {
				_css.remove(btns[prevIndx], 'idlg-btn-focus');
				_css.add(btns[focusIndx], 'idlg-btn-focus');
				focusDiag.focus();
			}
		}
		
	});
	
	// 浏览器窗口resize后重置对话框位置
	var idlg_rstimer = null;
	_EvtUtils.bind(root, 'resize', function () {
		if(idlg_rstimer) {
			clearTimeout(idlg_rstimer);
			idlg_rstimer = null;
		}

		idlg_rstimer = setTimeout(function() {
			for(var i = 0, len = _topWin['_idlg_list_'].length; i < len; i++) {
				_topWin['_idlg_list_'][i].resetPosition();
			}
			
			if(_isIE6) {
				var $mask = document.getElementById('_idlg_mask_');
				if($mask && $mask.style.display != 'none') {
					var ws = _winSize(root);
					$mask.style.width = ws.sw + 'px';
					$mask.style.height = ws.sh + 'px';
				}
			}
		}, 150);
	});
	

// 模板
Dialog._tmpl = '<div class="idlg-outer" style="position:relative;">{rs_tmpl}'
//+	'<div class="idlg-inner">'
+		'<a href="javascript:void(0);" class="idlg-min" style="display:none;">&nbsp;</a>'
+		'<a href="javascript:void(0);" class="idlg-max" style="display:none;">&nbsp;</a>'
+		'<a href="javascript:void(0);" class="idlg-close" style="display:none;">x</a>'
+		'<div class="idlg-header"><div class="idlg-title"></div></div>'
+		'<div class="idlg-main"></div>'
+		'<div class="idlg-footer" style="display:none;"><div class="idlg-btns"></div></div>'
//+	'</div>'
+	'<span class="idlg-arw" style="display:none;"><i class="arw-out"></i><i class="arw-in"></i></span>'
+'</div>';

Dialog.ifrm_tmpl = '<iframe src="about:blank" class="idlg-iframe" width="100%" height="100%" frameborder="0" scrolling="auto" hidefocus="true" allowtransparency="true"></iframe>'
+'<div class="idlg-iframecover" style="display:none;position:absolute;z-index:2;left:0;top:0;right:0;bottom:0;width:100%;height:100%;background-color:#ffffff;opacity:0;filter:alpha(opacity=0);overflow:hidden;"></div>';

Dialog.rs_tmpl = '<div class="idlg-n">&nbsp;</div><div class="idlg-ne">&nbsp;</div><div class="idlg-se">&nbsp;</div>'
+'<div class="idlg-s">&nbsp;</div><div class="idlg-sw">&nbsp;</div><div class="idlg-nw">&nbsp;</div>'
+'<div class="idlg-w">&nbsp;</div><div class="idlg-e">&nbsp;</div>';


/**
 * 默认配置
 */ 
Dialog.defaults = {

	/** 
	 * 窗口唯一标识，建议定义，这样可以避免重复弹出窗口
	 * @type String
	 */
	id: null,	
	
	/**
	 * 窗口标题，可以自定义；如果为 false，则隐藏标题
	 * @type String, false, null
	 */
	title: false,

    /**
     * 窗口标题，使用最新风格UI
     * @type String, false, null
     */
    uiStyle: "fh-ui",

	/** 
	 * 窗口打开URL页面	
	 * @type String
	 */
	url: null,	  
	
	/**
	 * 窗口显示content字符串内容
	 * @type String, HTMLElement, function
	 */
	content: '',
	
	/**
	 * 窗口宽度， 默认为300px
	 * @type Number, String
	 */
	width: 300,

	/**
	 * 窗口高度，如果不指定，则自适应内容高度
	 * @type Number, String	
	 */
	height: 'auto',	
	
	/**
	 * 窗口水平显示位置，默认居中，支持百分比和具体数值
	 * @type Number, String(px, %)
	 */
	left: "50%",

	/**
	 * 窗口垂直显示位置，默认黄金分割比例显示，支持百分比和具体数值
	 * @type Number, String(px, %)
	 */
	top: "38.2%", 

	/**
	 * 窗口特殊主题样式（需要重写样式css），默认 默认主题样式
	 * @type String
	 */
	theme: null,
	
	/**
	 * 是否显示窗口右上角的关闭按钮
	 * @type Boolean
	 */
	closable: true, 

	/**
	 * 是否显示最大化按钮
	 * @type Boolean
	 */
	maxable: false,
	
	/**
	 * 是否显示最小化按钮
	 * @type Boolean
	 */
	minable: false,
	
	/**
	 * 窗口是否允许拖动，默认允许
	 * @type Boolean
	 */
	dragable: true,

	/**
	 * 窗口是否允许 resize 大小，默认不允许
	 * @type Boolean
	 */
	resizable: false,

	/**
	 * 是否静止定位不动，不支持IE6
	 * @type Boolean
	 */
	fixed: true, 
	
	/**
	 * 窗口是否为模态窗口(是否显示背景遮罩层)，
	 * @type Boolean
	 */
	modal: true,
	
	/**
	 * 弹出的窗口显示在哪个元素附近
	 * @type HTMLElement, {target:"string|HTMLElement", placement:"top|bottom|left|right"}
	 */
	follow: null,
	
	/**
	 * .confirm
	 * @type 按钮数组，按钮对象为：{id:'', label:'', width:'', intent:'primary|success|warning|danger', 
	 *								disabled:true|false, focus:true|false, align:left|right|center, click:function{}}
	 */
	button: [],

	/**
	 * 点击遮罩背景关闭窗口
	 * @type Boolean
	 */
	quickClosable: false, 

	/**
   * 窗口显示的上下文环境，默认顶层窗口
	 * @type Window
	 */
	context: null,

	/**
	 * 窗口显示在指定的容器中，默认 document.body下
	 * @type Element
	 */
	 container: null,
	
	/**
	 * 自定义显示层级数
	 * @type Number
	 */
	zindex: 9999,    
	
	/**
	 * 重置窗口关闭事件，函数this对象为Dialog
	 * @type function
	 */
	closeEvent: null, 
	
	/**
	 * 重置窗口最大化事件，函数this对象为Dialog
	 * @type function
	 */
	maximizeEvent: null, 
	
	/**
	 * 重置窗口最小化事件，函数this对象为Dialog
	 * @type function
	 */
	minimizeEvent: null, 
	
	/**
	 * 窗口打开后，执行的事件
	 * @type function
	 */
	onLoad: null, 
	
	/**
	 * 当窗口显示后要执行的回调函数
	 * 注意和onLoad的区分，注：函数上下文this对象指向Dialog
	 * @type function
	 */
	onShow: null,

	/**
	 * 当窗口关闭后要执行的回调函数，注：函数上下文this对象指向Dialog
	 * @type function
	 */
	onClosed: null,
	
	/**
	 * 当窗口被拖动时要执行的回调函数，注：函数上下文this对象指向Dialog
	 * @type function({'left':x, 'top':y})
	 */
	onDrag: null,
	
	/**
	 * 当窗口被改变大小时要执行的回调函数，注：函数上下文this对象指向Dialog
	 * @type function({'width':w, 'height':h, 'left':x, 'top':y})
	 */
	onResize: null,
	
	// 窗口resize的最小尺寸限制
	_resize: { 'minWidth': 200, 'minHeight': 100 },
	
	alert: {
		title: '信息',
		yesLabel: '确定'
	},

	confirm: {
		title: '询问',
		yesLabel: '确定',
		noLabel: '取消'
	}
	
};

	// 提供 noConflict方法避免Dialog名称冲突
	var _Dialog = root.Dialog;
	Dialog.noConflict = function() {
		root.Dialog = _Dialog;
		return Dialog;
	};
	
	// 支持 AMD module，比如：使用 requirejs 加载
	if(typeof define === 'function' && define.amd) {
		define(function() {
			return Dialog;
		});
	}

	// 导出Dialog为全局变量
	!root.Dialog && (root.Dialog = Dialog);
	
})(window, document);
},{}],2:[function(require,module,exports){
/**
 * FUI component -- Pagination
 * @author yswang
 * @version 2016/05/17
 */
;(function(window, document, undefined){
	var Pagination = function(target, opts) {
		opts = opts || {};
		if(!target) return;
		
		this._id = '_ai_pg_'+ (target.id ? target.id : (+new Date()));
		this.target = target.jquery ? target[0] : target;
		this.config = {};
		for(var p in Pagination.defaults) {
			this.config[p] = typeof opts[p] === 'undefined' ? Pagination.defaults[p] : opts[p];
		}
		if('[object Object]' == {}.toString.call(this.config.resizer) && this.config.resizer.label === undefined) {
			this.config.resizer.label = Pagination.defaults.resizer.label;
		}
		var cfg = this.config;
		// check
		this.totalrows = parseInt(cfg.totalrows, 10);
		this.pageno = parseInt(cfg.pageno, 10);
		this.pagesize = parseInt(cfg.pagesize, 10);
		
		if (isNaN(this.totalrows) || this.totalrows < 0) { this.totalrows = 0; }
		if (isNaN(this.pageno) || this.pageno < 1) { this.page = 1; }
		if (isNaN(this.pagesize) || this.pagesize < 1) { this.pagesize = 20; }
		this.pages = this._getPages();
		if(this.pageno > this.pages) { this.pageno = this.pages; }
		
		// save instance
    if(window[this._id]) {
      window[this._id].config.callback = null;
      window[this._id] = null;
    }

		window[this._id] = this;
		this._init();
	};
	
	Pagination.prototype = {
		_init: function() {
			var _this = this,
				page_html = [],
				cfg = this.config,
				prevPage = this.pageno - 1, 
				nextPage = this.pageno + 1,
				mode = cfg.mode,
				_jumptxt = '',
				_target = this.target;
			
			if(this.totalrows <= 0) {
				_target.innerHTML = '';
				return;
			}
			
			// 如果页码不足2页则不显示
			if(this.totalpages < 2) {
				//_target.innerHTML = '';
				//return;
			}
			// 输出
			if(!_target.className || _target.className.indexOf('ai-pager') == -1) {
				_target.className = 'ai-pager'+ (_target.className ? ' '+_target.className : '');
			}
			
			(mode == '' || typeof(mode) == 'undefined') ;
			// 迷你分页  
			if(mode == 'mini'){
				if(prevPage < 0) {
				    (cfg.firstlabel !== false) && page_html.push('<span class="page-first-dis">'+ cfg.firstlabel +'</span>');
					(cfg.prevlabel !== false) && page_html.push('<span class="page-prev-dis">'+ cfg.prevlabel +'</span>');
				} else {
					if (prevPage == 0){
						(cfg.prevlabel !== false) && page_html.push('<a  class="page-mini-disable">'+ cfg.prevlabel +'</a>');
					}else {
						(cfg.prevlabel !== false) && page_html.push('<a href="'+ _href(prevPage) +'" onclick="javascript:'+ this._id +'.toPage(' + prevPage + ');" class="page-prev-mini">'+ cfg.prevlabel +'</a>');
					}
				}
				page_html.push('<span class="mini-msg">'+this.pageno+'/'+this.totalpages+'</span>')
		
				if(nextPage == (this.totalpages+1)){
					(cfg.nextlabel !== false) && page_html.push('<a class="page-mini-disable">'+ cfg.nextlabel +'</a>');
				}else{
					(cfg.nextlabel !== false) && page_html.push('<a href="'+ _href(nextPage) +'" onclick="javascript:'+ this._id +'.toPage(' + nextPage + ');" class="page-next-mini">'+ cfg.nextlabel +'</a>');
				}
					
				mode == 'classic' && (cfg.lastlabel !== false) && page_html.push('<a href="'+ _href(this.totalpages) +'" onclick="javascript:'+ this._id +'.toPage(' + this.totalpages + ');" class="page-last">'+ cfg.lastlabel +'</a>');
			
			}
			
			
			
			// page info
			cfg.pageinfo === true && (cfg.pageinfo = Pagination.defaults.pageinfo);
			if(cfg.pageinfo && typeof cfg.pageinfo == 'string') {
				(mode !== 'mini')&&page_html.push('<div class="page-info">');
				(mode !== 'mini')&&page_html.push(this._formatLabel(cfg.pageinfo));
				(mode !== 'mini')&&page_html.push('</div>');
			} else {
				(_target.className.indexOf('no-pageinfo') == -1) && (_target.className += " no-pageinfo");
			}
			
			// page nos
			(mode !== 'mini')&&page_html.push('<div class="page-nos">');
			
			function _href(pageno){
				return !cfg.href ? "javascript:void(0);" 
						: cfg.href.replace(/#{\s*pageno\s*}/gi, pageno).replace(/#{\s*pagesize\s*}/gi, _this.pagesize);
			}
			
			if( (mode !== 'mini')&&cfg.resizer && '[object Array]' === {}.toString.call(cfg.resizer.values) && cfg.resizer.values.length > 0) {
				//page_html.push('<span class="page-rs-label">');
				//page_html.push(cfg.resizer.label);
				//page_html.push('</span>');
				page_html.push('<span class="page-rs"><select onchange="javascript:'+ this._id +'._doResize(this);">');
        // 传入了一个例外的pagesize值
        var isExceptPageSize = true;
        for(var i = 0; i < cfg.resizer.values.length; i++) {
          if(parseInt(cfg.resizer.values[i]) == _this.pagesize) {
            isExceptPageSize = false;
            break;
          }
				}
        
        // 传入了一个例外的pagesize值，则作为第一个额外加入
        if(isExceptPageSize) {
          cfg.resizer.values.splice(0, 0, _this.pagesize);
        }
        
				for(var i = 0; i < cfg.resizer.values.length; i++) {
					var s = parseInt(cfg.resizer.values[i]);
					(mode !== 'mini')&&page_html.push('<option value="'+ s +'"'+(s==_this.pagesize?" selected":"")+'>'+ s +(s==_this.pagesize?"":"")+'</option>');
				}
        
				(mode !== 'mini')&&page_html.push('</select><span class="page-rs-val">'+ (cfg.resizer.label.replace(/#{\s*size\s*}/gi, _this.pagesize)) +'</span><i class="right-icon-select caret-down"></i></span>');
			}
			
			if(prevPage < 0) {
				(mode !== 'mini')&&mode == 'classic' && (cfg.firstlabel !== false) && page_html.push('<span class="page-first-dis">'+ cfg.firstlabel +'</span>');
				(mode !== 'mini')&&mode == 'classic' && (cfg.prevlabel !== false) && page_html.push('<span class="page-prev-dis">'+ cfg.prevlabel +'</span>');
			} else {
				(mode !== 'mini')&&mode == 'classic'&& (cfg.firstlabel !== false) && page_html.push('<a href="'+ _href(1) +'" onclick="javascript:'+ this._id +'.toPage(1);" class="page-first">'+ cfg.firstlabel +'</a>');
				if (prevPage == 0){
					(mode !== 'mini')&&(cfg.prevlabel !== false) && page_html.push('<a  class="page-prev cun">'+ cfg.prevlabel +'</a>');
				}else {
					(mode !== 'mini')&&(cfg.prevlabel !== false) && page_html.push('<a href="'+ _href(prevPage) +'" onclick="javascript:'+ this._id +'.toPage(' + prevPage + ');" class="page-prev">'+ cfg.prevlabel +'</a>');
				}
			}
			
			// 非经典模式下，显示页码
			if((mode !== 'mini')&& mode != 'classic' && cfg.showpagenos && this._getPages() > 1) {
				if(this.pageno != 1) { 
					page_html.push('<a href="'+ _href(1) +'" onclick="javascript:'+ this._id +'.toPage(1);" class="page-no">1</a>');
				}
				
				if(this.pageno > 4 && (this.totalpages >7)) {
					page_html.push('<span class="page-ell 666">...</span>');
				}
				
				var endPage = 0;
				if(this.totalpages > this.pageno + 2 && (this.totalpages >7)) {
					endPage = this.pageno > 3 ? this.pageno + 2 : 6;
				} else {
					endPage = this.totalpages;
				}
				var len = this.totalpages >7 ? this.pageno - 2 : 0
				
				for(var i = len; i <= endPage; i++) {
					if(i > 0) {
						if(i == this.pageno) {
							page_html.push('<span class="page-curr">' + i + '</span>');
						} else {
							if (i != 1 && i != this.totalpages) {
								page_html.push('<a href="'+ _href(i) +'" onclick="javascript:'+ this._id +'.toPage(' + i + ');" class="page-no">' + i + '</a>');
							}
						}
					}
				}
				
				if(this.pageno + 3 < this.totalpages && (this.totalpages >7)) {
					page_html.push('<span class="page-ell ttt">...</span>');
				}
				
				if (this.pageno != this.totalpages) {
					page_html.push('<a href="'+ _href(this.totalpages) +'" onclick="javascript:'+ this._id +'.toPage(' + this.totalpages + ');" class="page-no">' + this.totalpages + '</a>');
				}
			}
			
			// enable jump page
			if(cfg.jumpable === true && this.totalpages > 1) {
				_jumptxt = this._formatLabel(cfg.jumpformat);
				var _jtTemp = document.createElement('span');
				_jtTemp.style.cssText = 'position:absolute;left:0;top:-100px;z-index:0;overflow:hidden;visibility:hidden;';
				_jtTemp.innerHTML = _jumptxt;
				document.body.appendChild(_jtTemp);
				var _jtW = _jtTemp.offsetWidth + 6;
				_jtTemp.parentNode.removeChild(_jtTemp);
				_jtTemp = null;
				
				(mode !== 'mini')&&page_html.push('<span class="page-jump"><input type="text" style="width:'+ _jtW +'px;" value="'+ _jumptxt +'" onfocus="'+ this._id +'._inputJump(this,event);" onblur="'+ this._id +'._toJump(this);" onkeyup="'+ this._id +'._toJump(this, event);"/></span>');
			}
			
			if ((mode !== 'mini')&& (nextPage > (this.totalpages+1)) ) {
				(mode !== 'mini')&&mode == 'classic' && (cfg.nextlabel !== false) && page_html.push('<span class="page-next-dis">'+ cfg.nextlabel +'</span>');
				(mode !== 'mini')&&mode == 'classic' && (cfg.lastlabel !== false) && page_html.push('<span class="page-last-dis">'+ cfg.lastlabel +'</span>');
			} else {
				if(nextPage == (this.totalpages+1)){
					(mode !== 'mini')&&(cfg.nextlabel !== false) && page_html.push('<a class="page-next cun">'+ cfg.nextlabel +'</a>');
				}else{
					(mode !== 'mini')&&(cfg.nextlabel !== false) && page_html.push('<a href="'+ _href(nextPage) +'" onclick="javascript:'+ this._id +'.toPage(' + nextPage + ');" class="page-next">'+ cfg.nextlabel +'</a>');
				}
				
				(mode !== 'mini')&&mode == 'classic' && (cfg.lastlabel !== false) && page_html.push('<a href="'+ _href(this.totalpages) +'" onclick="javascript:'+ this._id +'.toPage(' + this.totalpages + ');" class="page-last">'+ cfg.lastlabel +'</a>');
			}
	
			page_html.push('</div>');
			
			this.totalrows == 0 && (_target.className += " no-pages");
			_target.innerHTML = '';
			_target.innerHTML = page_html.join('');
		},
		
		_getPages: function() {
			this.totalpages = Math.ceil(this.totalrows / this.pagesize);
			return Math.max(0, this.totalpages);
		},
		
		_getFrom: function() {
			this.from = (this.pageno - 1) * this.pagesize + 1;
			return this.totalrows > 0 ? Math.max(0, this.from) : 0;
		},
		
		_getTo: function() {
			this.to = this.pageno * this.pagesize;
			return Math.max(0, Math.min(this.totalrows, this.to));
		},
		
		_formatLabel: function(str) {
			return str.replace(/#{\s*totalrows\s*}/gi, this.totalrows)
						.replace(/#{\s*pageno\s*}/gi, this.pageno)
						.replace(/#{\s*pagesize\s*}/gi, this.pagesize)
						.replace(/#{\s*from\s*}/gi, this._getFrom())
						.replace(/#{\s*to\s*}/gi, this._getTo())
						.replace(/#{\s*totalpages\s*}/gi, this._getPages());
		},
		_doResize : function(select) {
			var opt = select.options[select.selectedIndex];
			this.pagesize = opt.value;
			$(select).next('.page-rs-val').text(opt.text);
			this.toPage(1);
		},
		_inputJump: function(input) {
			input.value = this.pageno;
			input.select();
		},
		
		_toJump: function(input, evt) {
			var page = parseInt(input.value, 10), curno = this.pageno;
			if(isNaN(page) || page < 1) { 
				page = curno; 
			}
			
			if(page > this.totalpages) {
				page = this.totalpages;
			}
			
			if(!evt || evt.keyCode === 13) {
				this.pageno = page;
				input.value = this._formatLabel(this.config.jumpformat);//page + ' / '+ this.totalpages; 
				(curno != this.pageno) ? this.toPage(page) : input.blur();
			}
		},
		
		toPage: function(page) {
			if(page == 0 || (page == this.totalpages+1)){
				return
			}
			this.pageno = Math.min(Math.max(1, page), this.totalpages);
			typeof this.config.callback == 'function' && this.config.callback.call(this, this.pageno, this.pagesize);	
			this._init();
		},
		firstPage: function() {
			this.toPage(1);
		},
		prevPage: function() {
			(this.pageno > 1) && this.toPage(this.pageno - 1);
		},
		nextPage: function() {
			(this.pageno < this.totalpages) && this.toPage(this.pageno + 1);
		},
		lastPage: function() {
			this.toPage(this.totalpages);
		}
	};
	
	Pagination.defaults = {
		totalrows: 0,
		pagesize: 20,
		pageno: 1,
		pageinfo: '共 #{totalrows} 条记录，当前显示第 #{from} - #{to} 条',
		firstlabel: '首页',
		prevlabel: '<',
		nextlabel: '>',
		lastlabel: '尾页',
		resizer: {values:[10,20,50,100,200,500], label: " #{size} 条/页"},
		jumpable: true,
		jumpformat: '#{pageno} / #{totalpages} 页',
		showpagenos: true,
		mode: 'modern',
		href: 'javascript:void(0);',
		callback: false
	};

	!window.Pagination && (window.Pagination = Pagination);
	
})(window, document);

//jQuery plugin
;(function(jq){
	if(!jq) return;
	jq.fn.pagination = function(opts) {
		return new Pagination(this[0], opts);
	};
})(window.jQuery);

},{}],3:[function(require,module,exports){
require("./bootstrap/position");
require("./bootstrap/transition");
require("./bootstrap/alert");
require("./bootstrap/button");
require("./bootstrap/carousel");
require("./bootstrap/collapse");
require("./bootstrap/dropdown");
require("./bootstrap/modal");
require("./bootstrap/tab");
require("./bootstrap/affix");
require("./bootstrap/scrollspy");
require("./bootstrap/tooltip");
require("./bootstrap/popover");
require("./bootstrap/global");
require("./bootstrap/step");
require("./bootstrap/areaMultiSelect");
require("./bootstrap/timeline");
require("./bootstrap/cascader");
require("./bootstrap/dropdown-select");
require("./bootstrap/rate");
require("./bootstrap/navDrawer");
require("./bootstrap/navTop");

},{"./bootstrap/affix":4,"./bootstrap/alert":5,"./bootstrap/areaMultiSelect":6,"./bootstrap/button":7,"./bootstrap/carousel":8,"./bootstrap/cascader":9,"./bootstrap/collapse":10,"./bootstrap/dropdown":12,"./bootstrap/dropdown-select":11,"./bootstrap/global":13,"./bootstrap/modal":14,"./bootstrap/navDrawer":15,"./bootstrap/navTop":16,"./bootstrap/popover":17,"./bootstrap/position":18,"./bootstrap/rate":19,"./bootstrap/scrollspy":20,"./bootstrap/step":21,"./bootstrap/tab":22,"./bootstrap/timeline":23,"./bootstrap/tooltip":24,"./bootstrap/transition":25}],4:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: affix.js v3.3.7
 * http://getbootstrap.com/javascript/#affix
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // AFFIX CLASS DEFINITION
  // ======================

  var Affix = function (element, options) {
    this.options = $.extend({}, Affix.DEFAULTS, options)

    this.$target = $(this.options.target)
      .on('scroll.bs.affix.data-api', $.proxy(this.checkPosition, this))
      .on('click.bs.affix.data-api',  $.proxy(this.checkPositionWithEventLoop, this))

    this.$element     = $(element)
    this.affixed      = null
    this.unpin        = null
    this.pinnedOffset = null

    this.checkPosition()
  }

  Affix.VERSION  = '3.3.7'

  Affix.RESET    = 'affix affix-top affix-bottom'

  Affix.DEFAULTS = {
    offset: 0,
    target: window
  }

  Affix.prototype.getState = function (scrollHeight, height, offsetTop, offsetBottom) {
    var scrollTop    = this.$target.scrollTop()
    var position     = this.$element.offset()
    var targetHeight = this.$target.height()

    if (offsetTop != null && this.affixed == 'top') return scrollTop < offsetTop ? 'top' : false

    if (this.affixed == 'bottom') {
      if (offsetTop != null) return (scrollTop + this.unpin <= position.top) ? false : 'bottom'
      return (scrollTop + targetHeight <= scrollHeight - offsetBottom) ? false : 'bottom'
    }

    var initializing   = this.affixed == null
    var colliderTop    = initializing ? scrollTop : position.top
    var colliderHeight = initializing ? targetHeight : height

    if (offsetTop != null && scrollTop <= offsetTop) return 'top'
    if (offsetBottom != null && (colliderTop + colliderHeight >= scrollHeight - offsetBottom)) return 'bottom'

    return false
  }

  Affix.prototype.getPinnedOffset = function () {
    if (this.pinnedOffset) return this.pinnedOffset
    this.$element.removeClass(Affix.RESET).addClass('affix')
    var scrollTop = this.$target.scrollTop()
    var position  = this.$element.offset()
    return (this.pinnedOffset = position.top - scrollTop)
  }

  Affix.prototype.checkPositionWithEventLoop = function () {
    setTimeout($.proxy(this.checkPosition, this), 1)
  }

  Affix.prototype.checkPosition = function () {
    if (!this.$element.is(':visible')) return

    var height       = this.$element.height()
    var offset       = this.options.offset
    var offsetTop    = offset.top
    var offsetBottom = offset.bottom
    var scrollHeight = Math.max($(document).height(), $(document.body).height())

    if (typeof offset != 'object')         offsetBottom = offsetTop = offset
    if (typeof offsetTop == 'function')    offsetTop    = offset.top(this.$element)
    if (typeof offsetBottom == 'function') offsetBottom = offset.bottom(this.$element)

    var affix = this.getState(scrollHeight, height, offsetTop, offsetBottom)

    if (this.affixed != affix) {
      if (this.unpin != null) this.$element.css('top', '')

      var affixType = 'affix' + (affix ? '-' + affix : '')
      var e         = $.Event(affixType + '.bs.affix')

      this.$element.trigger(e)

      if (e.isDefaultPrevented()) return

      this.affixed = affix
      this.unpin = affix == 'bottom' ? this.getPinnedOffset() : null

      this.$element
        .removeClass(Affix.RESET)
        .addClass(affixType)
        .trigger(affixType.replace('affix', 'affixed') + '.bs.affix')
    }

    if (affix == 'bottom') {
      this.$element.offset({
        top: scrollHeight - height - offsetBottom
      })
    }
  }


  // AFFIX PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.affix')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.affix', (data = new Affix(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.affix

  $.fn.affix             = Plugin
  $.fn.affix.Constructor = Affix


  // AFFIX NO CONFLICT
  // =================

  $.fn.affix.noConflict = function () {
    $.fn.affix = old
    return this
  }


  // AFFIX DATA-API
  // ==============

  $(window).on('load', function () {
    $('[data-spy="affix"]').each(function () {
      var $spy = $(this)
      var data = $spy.data()

      data.offset = data.offset || {}

      if (data.offsetBottom != null) data.offset.bottom = data.offsetBottom
      if (data.offsetTop    != null) data.offset.top    = data.offsetTop

      Plugin.call($spy, data)
    })
  })

}(jQuery);

},{}],5:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: alert.js v3.3.7
 * http://getbootstrap.com/javascript/#alerts
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // ALERT CLASS DEFINITION
  // ======================

  var dismiss = '[data-dismiss="alert"]'
  var Alert   = function (el) {
    $(el).on('click', dismiss, this.close)
  }

  Alert.VERSION = '3.3.7'

  Alert.TRANSITION_DURATION = 150

  Alert.prototype.close = function (e) {
    var $this    = $(this)
    var selector = $this.attr('data-target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    var $parent = $(selector === '#' ? [] : selector)

    if (e) e.preventDefault()

    if (!$parent.length) {
      $parent = $this.closest('.alert')
    }

    $parent.trigger(e = $.Event('close.bs.alert'))

    if (e.isDefaultPrevented()) return

    $parent.removeClass('in')

    function removeElement() {
      // detach from parent, fire event then clean up data
      $parent.detach().trigger('closed.bs.alert').remove()
    }

    $.support.transition && $parent.hasClass('fade') ?
      $parent
        .one('bsTransitionEnd', removeElement)
        .emulateTransitionEnd(Alert.TRANSITION_DURATION) :
      removeElement()
  }


  // ALERT PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.alert')

      if (!data) $this.data('bs.alert', (data = new Alert(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  var old = $.fn.alert

  $.fn.alert             = Plugin
  $.fn.alert.Constructor = Alert


  // ALERT NO CONFLICT
  // =================

  $.fn.alert.noConflict = function () {
    $.fn.alert = old
    return this
  }


  // ALERT DATA-API
  // ==============

  $(document).on('click.bs.alert.data-api', dismiss, Alert.prototype.close)

}(jQuery);

},{}],6:[function(require,module,exports){
/* ========================================================================
 * areaMultiSelect地区多选组件v1.0.0 2018 
 * 20180817修改组件名称regionalMultiSelection为areaMultiSelect
 * ======================================================================== */

+function ($) {
  'use strict';

  // areaMultiSelect CLASS DEFINITION
  // =========================
  var AreaMultiSelect = function (element, options) {
    this.$element = $(element);
    this.$AreaMultiSelect = '';
    this.options = $.extend({}, AreaMultiSelect.DEFAULTS, options);
  }

  AreaMultiSelect.VERSION = '1.0.0'

  AreaMultiSelect.DEFAULTS = {
    "trigger": "click",
    "mode": "default",
    "data": [
      {
        id: "0",//必选项
        name: "数据为空",//必选项
        type: "",
        maskClosable: false,
        children: []
      }
    ],
    "selectList": []
  };

  AreaMultiSelect.prototype.templeteRoot = function () {
    var _self = this;
    var root = '<div class="area-multi-select">';
    root += '<div class="select-content-outer">';
    if (_self.options.maskClosable) {
      root += '<div class="close-mesk"></div>';
    }
    root += '<div class="select-content">';
    root += '<div class="select-content-top">选择地区<i class="aidicon aidicon-close"></i></div>';
    root += '<div class="select-content-center">';
    root += '</div>';
    root += '<div class="select-content-bottom">';
    root += '<button type="button" class="btn submit btn-primary btn-sm">确定</button>';
    root += '<button type="button" class="btn clear btn-default btn-sm">清除</button>';
    root += '<button type="button" class="btn cancel btn-default btn-sm">取消</button>';
    root += '</div>';
    root += '</div>';
    root += '</div>';
    root += '</div>';
    return $(root);
  }


  AreaMultiSelect.prototype.templeteProvince = function (obj) {//省模板-需要用的节点信息也可以根据业务需求记录在dom属性或者data里，方便获取
    var ele = $('<div class="select-content-center-in clearfix"></div>');
    var provinceStr = '<div class="select-content-center-in-left">';
    provinceStr += '<label class="checkbox-inline checkbox-beauty">';
    provinceStr += '<input type="checkbox">' + '<span class="text-label">' + obj.name + '</span>';
    provinceStr += '</label></div>';
    var $provinceStr = $(provinceStr);
    $provinceStr.find(".text-label").data("node", obj);
    ele.append($provinceStr);
    ele.append($('<div class="select-content-center-in-right"></div>'))
    return ele;
  }
  AreaMultiSelect.prototype.templeteCity = function (obj) {//市模板-需要用的节点信息也可以根据业务需求记录在dom属性或者data里，方便获取
    var _self = this;
    var cityStr = '<div class = "content-item">';
    cityStr += '<label class="checkbox-inline checkbox-beauty">';
    cityStr += '<input type="checkbox">';
    cityStr += '<span class="text-label">' + obj.name + '</span>';
    cityStr += '</label>';
    if (obj.children.length > 0) {
      cityStr += '<span class="caret"></span>';
      cityStr += '<div class="select-content-child">';
      cityStr += '<div class="select-content-child-top"></div>';
      if (_self.options.mode === "strict") {
        cityStr += '<div class="select-content-child-bottom">';
      }else{
        cityStr += '<div class="select-content-child-bottom default">';
      }  

      cityStr += '<button type="button" class="btn submit btn-primary btn-sm">确定</button>';
      cityStr += '<button type="button" class="btn cancel btn-default btn-sm">取消</button>';
      cityStr += '</div>';
      cityStr += '</div>';
    }
    cityStr += '</div>';

    var $cityStr = $(cityStr);
    $cityStr.find(".text-label").data("node", obj);

    return $cityStr;
  }
  AreaMultiSelect.prototype.templeteArea = function (obj) {
    var areaStr = '';
    if (obj.name.length > 5) {
      areaStr += '<label class="checkbox-inline checkbox-beauty showTips" data-toggle="popover" data-placement="top" data-content="' + obj.name + '">';
    } else {
      areaStr += '<label class="checkbox-inline checkbox-beauty">';
    }

    areaStr += '<input type="checkbox">';
    areaStr += '<span class="text-label">' + obj.name + '</span>';
    areaStr += '</label>';

    var $areaStr = $(areaStr);
    $areaStr.find(".text-label").data("node", obj);

    return $areaStr;
  }
  AreaMultiSelect.prototype.selectChild = function ($element) {
    var selectNumber = 0;
    $element.parents(".select-content-child").find(".select-content-child-top input:checkbox").each(function () {
      if ($(this).prop('checked')) {
        selectNumber += 1;
      }
    });
    $element.parents(".content-item").children("label").find(".text-label span").remove();
    $element.parents(".select-content-child").siblings(".checkbox-beauty").removeClass("part-select");

    if (selectNumber > 0) {
      $element.parents(".content-item").children("label").children(".text-label").append("<span>(" + selectNumber + ")</span");
      if (selectNumber != $element.parents(".select-content-child").find(".select-content-child-top input").length) {
        $element.parents(".select-content-child").siblings(".checkbox-beauty").addClass("part-select");
      }
    }
  }

  AreaMultiSelect.prototype.returnSelect = function () {
    var _self = this;
    var province = "省份：";
    var city = "城市：";
    var area = "区域：";
    var provinceList = [];
    var cityList = [];
    var areaList = [];
    var provinceObjList = [];
    var cityObjList = [];
    var areaObjList = [];
    var provinceIdList = [];
    var cityIdList = [];
    var areaIdList = [];

    //处理选中的省数据
    _self.$AreaMultiSelect.find(".select-content-center-in-left input:checkbox:checked").each(function (index) {
      provinceList.push($(this).siblings(".text-label").html());
      provinceObjList.push($(this).siblings(".text-label").data("node"));
      provinceIdList.push($(this).siblings(".text-label").data("node").id);
    });

    //处理选中的市数据，若该市所属省为选中状态，则不单独输出该市
    _self.$AreaMultiSelect.find(".content-item>label input:checkbox:checked").each(function (index) {
      if ($(this).parents(".select-content-center-in").find(".select-content-center-in-left input:checkbox").prop('checked')) return;
      cityList.push($(this).parents(".select-content-center-in").find(".select-content-center-in-left .text-label").html() + "-" + $(this).siblings(".text-label").html().split("<span>")[0]);
      cityObjList.push($(this).siblings(".text-label").data("node"));
      cityIdList.push($(this).siblings(".text-label").data("node").id);
    });

    //处理选中的区域数据，若该区域所属市为选中状态，则不单独输出区域
    _self.$AreaMultiSelect.find(".content-item .select-content-child input:checkbox:checked").each(function (index) {
      if ($(this).parents(".content-item").children(".checkbox-beauty").find("input:checkbox").prop('checked')) return;
      areaList.push($(this).parents(".select-content-center-in").find(".select-content-center-in-left .text-label").html() + "-" + $(this).parents(".content-item").children(".checkbox-beauty").find(".text-label").html().split("<span>")[0] + "-" + $(this).siblings(".text-label").html());
      areaObjList.push($(this).siblings(".text-label").data("node"));
      areaIdList.push($(this).siblings(".text-label").data("node").id);
    });

    // console.log(provinceObjList);
    // console.log(cityObjList);
    // console.log(areaObjList);
    // alert(province + provinceList.join(","));
    // alert(city + cityList.join(","));
    // alert(area + areaList.join(","));

    return {
      selectInfo: {
        "selectObjectList": {
          "provinceObjectList": provinceObjList,
          "cityObjectList": cityObjList,
          "areaObjectList": areaObjList,
          "all": provinceObjList.concat(cityObjList, areaObjList)
        },
        "selectNameList": {
          "provinceNameList": provinceList,
          "cityNameList": cityList,
          "areaNameList": areaList,
          "all": provinceList.concat(cityList, areaList)
        },
        "selectIdList": {
          "provinceIdList": provinceIdList,
          "cityIdList": cityIdList,
          "areaIdList": areaIdList,
          "all": provinceIdList.concat(cityIdList, areaIdList)
        }
      }
    };
  }


  AreaMultiSelect.prototype.init = function () {
    var _self = this;
    if (_self.$AreaMultiSelect) _self.$AreaMultiSelect.remove();

    if (_self.options.data.length > 0) {
      var $root = _self.templeteRoot();
      _self.options.data.forEach(function (item) {
        var $dom = _self.templeteProvince(item);
        if (item.children.length > 0) {
          item.children.forEach(function (childItem) {
            if (childItem.children.length > 0) {
              var $childDom = _self.templeteCity(childItem);
              childItem.children.forEach(function (childChild) {
                $childDom.find(".select-content-child-top").append(_self.templeteArea(childChild));
              })
              $dom.find(".select-content-center-in-right").append($childDom);
            } else {
              $dom.find(".select-content-center-in-right").append(_self.templeteCity(childItem));
            }
          });
        }
        $root.find(".select-content-center").append($dom);
        //_self.$element.append($root);
        _self.$AreaMultiSelect = $root;
        $(document.body).append(_self.$AreaMultiSelect);
        // $(".select-content-center").append($dom);
      })

      _self.initEvents();
      _self.setSelect(_self.options.selectList);
    }
  }
  AreaMultiSelect.prototype.initEvents = function () {
    //打开地区多选
    var _self = this;
    _self.$AreaMultiSelect.find(".showTips").popover({
      "trigger": "hover"
    });

    _self.$element.on(_self.options.trigger, function () {
      _self.$AreaMultiSelect.find(".select-content-outer").show(0, function () {
        console.log(_self.$AreaMultiSelect.find(".select-content-center").outerHeight());
        if (_self.$AreaMultiSelect.find(".select-content-center").outerHeight() >= 600) {
          _self.$AreaMultiSelect.find(".select-content").addClass("bigger");
        }
      });

      var startEvent = $.Event('afterOpen.bs.areaMultiSelect', _self.returnSelect());
      _self.$element.trigger(startEvent);
    })

    //左侧全选(省份)
    _self.$AreaMultiSelect.on('click', '.select-content-center-in-left .checkbox-inline', function () {
      var _this = $(this);
      _this.parent('.select-content-center-in-left').siblings(".select-content-center-in-right").find(".checkbox-inline").each(function () {
        $(this).find('input:checkbox').prop('checked', _this.find('input:checkbox').prop("checked"));
      });
      _self.$AreaMultiSelect.find(".select-content-child-bottom .btn").each(function () {
        _self.selectChild($(this));
      });
    })

    //右侧选择(城市)
    _self.$AreaMultiSelect.on('click', '.select-content-center-in-right .checkbox-inline', function () {
      var _this = $(this);
      _this.parents('.select-content-center-in-right').siblings(".select-content-center-in-left").find(".checkbox-inline input:checkbox").prop('checked', _this.parents('.select-content-center-in-right').find(".content-item > label input:checkbox").length == _this.parents('.select-content-center-in-right').find(".content-item > label input:checkbox:checked").length);

      _this.siblings(".select-content-child").find(".checkbox-inline").each(function () {
        $(this).find('input:checkbox').prop('checked', _this.find('input:checkbox').prop("checked"));
      });
      _self.selectChild(_this.siblings(".select-content-child").find(".select-content-child-bottom .btn"));

    })


    //点击空白取消子地区选择-default模式下生效
    if(_self.options.mode === "default"){
      _self.$AreaMultiSelect.on('click', '.select-content', function (e) {
        if((e.target.nodeName == "SPAN"||e.target.nodeName == "INPUT"||e.target.nodeName == "LABEL")||(e.target.nodeName == "DIV"&&$(e.target).hasClass("select-content-child-top"))) return
        _self.$AreaMultiSelect.find(".select-content-center-in-right .content-item .caret").each(function () {
          if ($(this).hasClass("open")) {
            $(this).siblings(".select-content-child").find('.select-content-child-bottom .btn.submit').trigger("click");
          }
        });
      })
    }
    

    //打开选择子地区
    _self.$AreaMultiSelect.on('click', '.select-content-center-in-right .content-item .caret', function () {
      if(_self.options.mode === "strict"){//严格模式
        if ($(this).hasClass("open")) return
        _self.$AreaMultiSelect.find(".select-content-center-in-right .content-item .caret").each(function () {
          if ($(this).hasClass("open")) {
            $(this).siblings(".select-content-child").find('.select-content-child-bottom .btn.cancel').trigger("click");
          }
        });
      }else{ 
        if ($(this).hasClass("open")) {
          $(this).siblings(".select-content-child").find('.select-content-child-bottom .btn.submit').trigger("click");
          return
        }
        _self.$AreaMultiSelect.find(".select-content-center-in-right .content-item .caret").each(function () {
          if ($(this).hasClass("open")) {
            $(this).siblings(".select-content-child").find('.select-content-child-bottom .btn.submit').trigger("click");
          }
        });
      }

      if ($(this).siblings(".select-content-child")) {
        $(this).siblings(".select-content-child").show();
        $(this).addClass("open");
        $(this).parents(".select-content-center-in").find(".checkbox-inline").each(function () {//记录打开子区域选择时当前省数据所有选中的状态，便于取消时还原
          $(this).find('input:checkbox').data("oldChecked", $(this).find('input:checkbox').prop('checked'));
        })
      }



    })

    //区域选择
    _self.$AreaMultiSelect.on('click', '.select-content-child .checkbox-inline', function () {

      _self.selectChild($(this).parents(".select-content-child").find(".select-content-child-bottom .btn"));

      $(this).parents(".select-content-child").siblings(".checkbox-inline").find('input:checkbox').prop('checked', $(this).parents(".select-content-child").find('input:checkbox').length === $(this).parents(".select-content-child").find('input:checkbox:checked').length);

      $(this).parents('.select-content-center-in-right').siblings(".select-content-center-in-left").find(".checkbox-inline input:checkbox").prop('checked', $(this).parents('.select-content-center-in-right').find(".content-item > label input:checkbox").length === $(this).parents('.select-content-center-in-right').find(".content-item > label input:checkbox:checked").length);

    })


    //区域选择中的确认
    _self.$AreaMultiSelect.on('click', '.select-content-child-bottom .btn.submit', function (event) {
      $(this).parents(".select-content-child").hide();
      $(this).parents(".select-content-child").siblings(".caret").removeClass("open");
    })
    //区域选择中的取消
    _self.$AreaMultiSelect.on('click', '.select-content-child-bottom .btn.cancel', function (event) {
      if ($(this).parents(".select-content-child:visible").length <= 0) return;
      $(this).parents(".select-content-center-in").find("input:checkbox").each(function () {
        if ($(this).data("oldChecked")) {
          $(this).prop('checked', true);
        } else {
          $(this).prop('checked', false);
        }
      });
      _self.selectChild($(this));

      $(this).parents(".select-content-child").hide();
      $(this).parents(".select-content-child").siblings(".caret").removeClass("open");
    })


    //区域多选弹出框的确认，这里只输出了名称，其他字段比如id等，根据业务调整
    _self.$AreaMultiSelect.on('click', '.select-content-bottom .btn.submit', function () {

      var startEvent = $.Event('submit.bs.areaMultiSelect', _self.returnSelect());
      _self.$element.trigger(startEvent);

      _self.$AreaMultiSelect.find(".text-label span").remove();
      $(this).parents(".select-content-outer").find('input:checkbox').prop('checked', false);
      _self.setSelect(_self.options.selectList);
      $(this).parents(".select-content-outer").hide();
    })

    _self.$AreaMultiSelect.on('click', '.select-content-bottom .btn.cancel, .select-content-top .aidicon-close,.close-mesk', function () {
      var startEvent = $.Event('cancel.bs.areaMultiSelect', _self.returnSelect());
      _self.$element.trigger(startEvent);

      _self.$AreaMultiSelect.find(".text-label span").remove();
      $(this).parents(".select-content-outer").find('input:checkbox').prop('checked', false);
      _self.setSelect(_self.options.selectList);
      $(this).parents(".select-content-outer").hide();
    })
    _self.$AreaMultiSelect.on('click', '.select-content-bottom .btn.clear', function () {
      var startEvent = $.Event('clear.bs.areaMultiSelect', _self.returnSelect());
      _self.$element.trigger(startEvent);

      _self.$AreaMultiSelect.find(".text-label span").remove();
      $(this).parents(".select-content-outer").find('input:checkbox').prop('checked', false);
    })

  }
  AreaMultiSelect.prototype.setSelect = function (selectList) {//设置选中
    var _self = this;

    _self.$AreaMultiSelect.find(".text-label span").remove();
    _self.$AreaMultiSelect.find(".select-content-outer input:checkbox").prop('checked', false);

    // if (selectList.length > 0) {
    //   selectList.forEach(function (item) {
    //     _self.$AreaMultiSelect.find(".checkbox-beauty").each(function (index) {
    //       if ($(this).find(".text-label").data("node").id == item && !$(this).find("input:checkbox").prop("checked")) {
    //         $(this).find("input:checkbox").trigger("click");
    //       }
    //     });
    //   })
    // }
    var $domList = {};
    _self.$AreaMultiSelect.find(".checkbox-beauty").each(function (index) {
      $domList[$(this).find(".text-label").data("node").id] = $(this);
    });
    selectList.forEach(function (item) {
      if ($domList[item] && !$domList[item].find("input:checkbox").prop("checked")) {
        $domList[item].find("input:checkbox").trigger("click");
      }
    })



    // var $domList = {};
    // _self.$AreaMultiSelect.find(".checkbox-beauty").each(function (index) {
    //   $domList[$(this).find(".text-label").data("node").id] = $(this);
    // });

   
    
    // if (_self.options.data.length > 0) {
    //   _self.options.data.forEach(function (item) {
    //     if(selectList.indexOf(item.id) >= 0 ){
    //       if (item.children.length > 0) {
    //         item.children.forEach(function (childItem) {
    //           selectList.push(childItem.id);
    //           if (childItem.children.length > 0) {
    //             childItem.children.forEach(function (childItemIn) {
    //               selectList.push(childItemIn.id);
    //             });
    //           }
    //         });
    //       }
    //     }
    //   })
    // }
  
    // selectList.forEach(function (item) {
    //   if ($domList[item] && !$domList[item].find("input:checkbox").prop("checked")) {
    //     $domList[item].find("input:checkbox").prop("checked",true);
    //   }
    // })
   


  }





  // AreaMultiSelect PLUGIN DEFINITION
  // ========================

  function Plugin(option, params) {
    return this.each(function () {
      var data = $(this).data('bs.areaMultiSelect')
      if (typeof option == 'string' && data) {
        return data[option](params);
      } else if (typeof option == 'string' && !data) {
        $.error('该组件未初始化！');
      } else if (typeof option === 'object' && data) {
        data.options = $.extend({}, AreaMultiSelect.DEFAULTS, data.options, option);
        return data.init();
      } else if (typeof option === 'object' && !data) {
        $(this).data('bs.areaMultiSelect', (data = new AreaMultiSelect(this, option)))
        return data.init();
      } else if (!option && !data) {
        $(this).data('bs.areaMultiSelect', (data = new AreaMultiSelect(this, option)))
        return data.init();
      } else if (!option && data) {
        return data.init();
      } else {
        $.error('其他错误');
      }
    })
  }

  var old = $.fn.areaMultiSelect

  $.fn.areaMultiSelect = Plugin
  $.fn.areaMultiSelect.Constructor = AreaMultiSelect

  // areaMultiSelect DATA-API
  // =================



}(jQuery);

},{}],7:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: button.js v3.3.7
 * http://getbootstrap.com/javascript/#buttons
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // BUTTON PUBLIC CLASS DEFINITION
  // ==============================

  var Button = function (element, options) {
    this.$element  = $(element)
    this.options   = $.extend({}, Button.DEFAULTS, options)
    this.isLoading = false
  }

  Button.VERSION  = '3.3.7'

  Button.DEFAULTS = {
    loadingText: 'loading...'
  }

  Button.prototype.setState = function (state) {
    var d    = 'disabled'
    var $el  = this.$element
    var val  = $el.is('input') ? 'val' : 'html'
    var data = $el.data()

    state += 'Text'

    if (data.resetText == null) $el.data('resetText', $el[val]())

    // push to event loop to allow forms to submit
    setTimeout($.proxy(function () {
      $el[val](data[state] == null ? this.options[state] : data[state])

      if (state == 'loadingText') {
        this.isLoading = true
        $el.addClass(d).attr(d, d).prop(d, true)
      } else if (this.isLoading) {
        this.isLoading = false
        $el.removeClass(d).removeAttr(d).prop(d, false)
      }
    }, this), 0)
  }

  Button.prototype.toggle = function () {
    var changed = true
    var $parent = this.$element.closest('[data-toggle="buttons"]')

    if ($parent.length) {
      var $input = this.$element.find('input')
      if ($input.prop('type') == 'radio') {
        if ($input.prop('checked')) changed = false
        $parent.find('.active').removeClass('active')
        this.$element.addClass('active')
      } else if ($input.prop('type') == 'checkbox') {
        if (($input.prop('checked')) !== this.$element.hasClass('active')) changed = false
        this.$element.toggleClass('active')
      }
      $input.prop('checked', this.$element.hasClass('active'))
      if (changed) $input.trigger('change')
    } else {
      this.$element.attr('aria-pressed', !this.$element.hasClass('active'))
      this.$element.toggleClass('active')
    }
  }


  // BUTTON PLUGIN DEFINITION
  // ========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.button')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.button', (data = new Button(this, options)))

      if (option == 'toggle') data.toggle()
      else if (option) data.setState(option)
    })
  }

  var old = $.fn.button

  $.fn.button             = Plugin
  $.fn.button.Constructor = Button


  // BUTTON NO CONFLICT
  // ==================

  $.fn.button.noConflict = function () {
    $.fn.button = old
    return this
  }


  // BUTTON DATA-API
  // ===============

  $(document)
    .on('click.bs.button.data-api', '[data-toggle^="button"]', function (e) {
      var $btn = $(e.target).closest('.btn')
      Plugin.call($btn, 'toggle')
      if (!($(e.target).is('input[type="radio"], input[type="checkbox"]'))) {
        // Prevent double click on radios, and the double selections (so cancellation) on checkboxes
        e.preventDefault()
        // The target component still receive the focus
        if ($btn.is('input,button')) $btn.trigger('focus')
        else $btn.find('input:visible,button:visible').first().trigger('focus')
      }
    })
    .on('focus.bs.button.data-api blur.bs.button.data-api', '[data-toggle^="button"]', function (e) {
      $(e.target).closest('.btn').toggleClass('focus', /^focus(in)?$/.test(e.type))
    })

}(jQuery);

},{}],8:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: carousel.js v3.3.7
 * http://getbootstrap.com/javascript/#carousel
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // CAROUSEL CLASS DEFINITION
  // =========================

  var Carousel = function (element, options) {
    this.$element    = $(element)
    this.$indicators = this.$element.find('.carousel-indicators')
    this.options     = options
    this.paused      = null
    this.sliding     = null
    this.interval    = null
    this.$active     = null
    this.$items      = null

    this.options.keyboard && this.$element.on('keydown.bs.carousel', $.proxy(this.keydown, this))

    this.options.pause == 'hover' && !('ontouchstart' in document.documentElement) && this.$element
      .on('mouseenter.bs.carousel', $.proxy(this.pause, this))
      .on('mouseleave.bs.carousel', $.proxy(this.cycle, this))
  }

  Carousel.VERSION  = '3.3.7'

  Carousel.TRANSITION_DURATION = 600

  Carousel.DEFAULTS = {
    interval: 5000,
    pause: 'hover',
    wrap: true,
    keyboard: true
  }

  Carousel.prototype.keydown = function (e) {
    if (/input|textarea/i.test(e.target.tagName)) return
    switch (e.which) {
      case 37: this.prev(); break
      case 39: this.next(); break
      default: return
    }

    e.preventDefault()
  }

  Carousel.prototype.cycle = function (e) {
    e || (this.paused = false)

    this.interval && clearInterval(this.interval)

    this.options.interval
      && !this.paused
      && (this.interval = setInterval($.proxy(this.next, this), this.options.interval))

    return this
  }

  Carousel.prototype.getItemIndex = function (item) {
    this.$items = item.parent().children('.item')
    return this.$items.index(item || this.$active)
  }

  Carousel.prototype.getItemForDirection = function (direction, active) {
    var activeIndex = this.getItemIndex(active)
    var willWrap = (direction == 'prev' && activeIndex === 0)
                || (direction == 'next' && activeIndex == (this.$items.length - 1))
    if (willWrap && !this.options.wrap) return active
    var delta = direction == 'prev' ? -1 : 1
    var itemIndex = (activeIndex + delta) % this.$items.length
    return this.$items.eq(itemIndex)
  }

  Carousel.prototype.to = function (pos) {
    var that        = this
    var activeIndex = this.getItemIndex(this.$active = this.$element.find('.item.active'))

    if (pos > (this.$items.length - 1) || pos < 0) return

    if (this.sliding)       return this.$element.one('slid.bs.carousel', function () { that.to(pos) }) // yes, "slid"
    if (activeIndex == pos) return this.pause().cycle()

    return this.slide(pos > activeIndex ? 'next' : 'prev', this.$items.eq(pos))
  }

  Carousel.prototype.pause = function (e) {
    e || (this.paused = true)

    if (this.$element.find('.next, .prev').length && $.support.transition) {
      this.$element.trigger($.support.transition.end)
      this.cycle(true)
    }

    this.interval = clearInterval(this.interval)

    return this
  }

  Carousel.prototype.next = function () {
    if (this.sliding) return
    return this.slide('next')
  }

  Carousel.prototype.prev = function () {
    if (this.sliding) return
    return this.slide('prev')
  }

  Carousel.prototype.slide = function (type, next) {
    var $active   = this.$element.find('.item.active')
    var $next     = next || this.getItemForDirection(type, $active)
    var isCycling = this.interval
    var direction = type == 'next' ? 'left' : 'right'
    var that      = this

    if ($next.hasClass('active')) return (this.sliding = false)

    var relatedTarget = $next[0]
    var slideEvent = $.Event('slide.bs.carousel', {
      relatedTarget: relatedTarget,
      direction: direction
    })
    this.$element.trigger(slideEvent)
    if (slideEvent.isDefaultPrevented()) return

    this.sliding = true

    isCycling && this.pause()

    if (this.$indicators.length) {
      this.$indicators.find('.active').removeClass('active')
      var $nextIndicator = $(this.$indicators.children()[this.getItemIndex($next)])
      $nextIndicator && $nextIndicator.addClass('active')
    }

    var slidEvent = $.Event('slid.bs.carousel', { relatedTarget: relatedTarget, direction: direction }) // yes, "slid"
    if ($.support.transition && this.$element.hasClass('slide')) {
      $next.addClass(type)
      $next[0].offsetWidth // force reflow
      $active.addClass(direction)
      $next.addClass(direction)
      $active
        .one('bsTransitionEnd', function () {
          $next.removeClass([type, direction].join(' ')).addClass('active')
          $active.removeClass(['active', direction].join(' '))
          that.sliding = false
          setTimeout(function () {
            that.$element.trigger(slidEvent)
          }, 0)
        })
        .emulateTransitionEnd(Carousel.TRANSITION_DURATION)
    } else {
      $active.removeClass('active')
      $next.addClass('active')
      this.sliding = false
      this.$element.trigger(slidEvent)
    }

    isCycling && this.cycle()

    return this
  }


  // CAROUSEL PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.carousel')
      var options = $.extend({}, Carousel.DEFAULTS, $this.data(), typeof option == 'object' && option)
      var action  = typeof option == 'string' ? option : options.slide

      if (!data) $this.data('bs.carousel', (data = new Carousel(this, options)))
      if (typeof option == 'number') data.to(option)
      else if (action) data[action]()
      else if (options.interval) data.pause().cycle()
    })
  }

  var old = $.fn.carousel

  $.fn.carousel             = Plugin
  $.fn.carousel.Constructor = Carousel


  // CAROUSEL NO CONFLICT
  // ====================

  $.fn.carousel.noConflict = function () {
    $.fn.carousel = old
    return this
  }


  // CAROUSEL DATA-API
  // =================

  var clickHandler = function (e) {
    var href
    var $this   = $(this)
    var $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) // strip for ie7
    if (!$target.hasClass('carousel')) return
    var options = $.extend({}, $target.data(), $this.data())
    var slideIndex = $this.attr('data-slide-to')
    if (slideIndex) options.interval = false

    Plugin.call($target, options)

    if (slideIndex) {
      $target.data('bs.carousel').to(slideIndex)
    }

    e.preventDefault()
  }

  $(document)
    .on('click.bs.carousel.data-api', '[data-slide]', clickHandler)
    .on('click.bs.carousel.data-api', '[data-slide-to]', clickHandler)

  $(window).on('load', function () {
    $('[data-ride="carousel"]').each(function () {
      var $carousel = $(this)
      Plugin.call($carousel, $carousel.data())
    })
  })

}(jQuery);

},{}],9:[function(require,module,exports){
/* ========================================================================
 * 级联选择器: cascader.js v1.0.0 2018
 * ======================================================================== */

+function ($) {
    'use strict';

    // CASCADER PUBLIC CLASS DEFINITION
    // ===============================
    var closeLabel = '[data-actions="label-close"]';
    var chooseAll = '[data-actions="chooseAll"]';
    var listChoose = '[data-actions="list-item"]:not(".check-all")';
    var labelChoose = '[data-actions="list-default"] label input:not(".check-all")';
    var tabChoose = '[data-actions="tab-choose"]';
    var btnSure = '[data-actions="sure"]';
    var btnCancel = '[data-actions="cancel"]';
    var Cascader = function (element, options) {
        this.type = null
        this.$element = null
        this.options = null
        this.cache = null
        this.isListType = null

        this.init('cascader', element, options)
    }

    Cascader.VERSION = '1.0.0'

    function setCascaderDropdownWidth($id, bool) {
        var width = 0;
        if (!bool) {
            $id.find('.cascader-dropdown-tab-item').each(function () {
                width += parseFloat($(this).outerWidth()) + 1;
            })
        } else {
            $id.find('.cascader-dropdown-content-box').each(function () {
                width += parseFloat($(this).outerWidth()) + 1;
            })
        }
        $id.css({width: width})
    }

    /*date专绝对秒*/
    function getAbsoluteSecond() {
        return Date.parse(new Date()) / 1000
    }

    /**
     * $this: 输入框；
     * $id: 下拉框
     *
     * **/
    function setPosition($this, $id) {
        var mt = parseFloat($id.css('marginTop')); // 下拉框的margin top用于调节与输入框之前的间距
        var mb = parseFloat($id.css('marginBottom')); // 下拉框的margin bottom用于调节与输入框之前的间距
        var height = $this.outerHeight();   // 输入框的高度
        var left = $this.offset().left; // 输入框的left
        var top = $this.offset().top; // 输入框的top
        var w = $id.outerWidth();  // 下拉框的宽度
        var h = $id.outerHeight(); // 下拉框的高度
        var dw = $('body').outerWidth();  // document的宽度
        var dh = $(document).height(); // document的高度

        var t = top + height + mt; // 下拉框的top
        var l = left;  // 下拉框的left

        t = (t + h) > dh && ((top - mb - h) > 0) ? (top - mb - h) : t;
        l = (l + w) > dw ? (dw - w) : l;

        $id.css({left: l, top: t});
    }

    /**
     * 计算 $el 的位置传给 data-id = id 的下拉
     * * **/
    function getDropdownPosition($this, id) {
        var $id = $(getDropdownByDataId(id));
        var $allTarget = $('body').find('.' + Cascader.MAINSTYLE.cascaderStyle);
        var $allDropTarget = $('body').find('.' + Cascader.MAINSTYLE.Style);

        $allTarget.removeClass(Cascader.EMBELLISHSTYLE.openStyle);
        // $allDropTarget.slideUp(Cascader.ANIMATIONTIME.up);
        $allDropTarget.hide();
        $this.addClass(Cascader.EMBELLISHSTYLE.openStyle);

        setPosition($this, $id);
        // $id.slideDown();
        $id.show();
        if (!this.isListType) {
            var len = $id.find('.' + Cascader.MAINSTYLE.tabStyle).length;
            var w = $id.find('.' + Cascader.MAINSTYLE.tabStyle).outerWidth();
            $id.css({width: len * w + 2}); // 加上边框的宽度
        }

    }

    function getDropdownByDataId(id) {
        return '.' + Cascader.MAINSTYLE.Style + '[data-id="' + id + '"]';
    }

    //  DOM结构
    Cascader.TEMPLATE = {
        warp: '<div class="{{cascaderStyle}}"><span class="cascader-text">{{cascaderContent}}</span><span class="cascader-arrow cascader-arrow-up aidicon aidicon-chevron-up"></span><span class="cascader-arrow cascader-arrow-down aidicon aidicon-chevron-down"></span></div>',
        text: '{{cascaderText}}',
        checkItem: '<span data-id="{{id}}" class="label label-default">{{cascaderItem}}<span class="label-close aidicon aidicon-close-line" data-actions="label-close"></span></span>'
    }

    Cascader.DROPTEMPLATE = {
        warp: '<div class="{{dropdownStyle}}" data-id="{{dataId}}">{{dropdownContent}}</div>',
        tab: '<div class="cascader-dropdown-tab">{{tabList}}</div>',
        tabList: '<div class="cascader-dropdown-tab-item {{tabStyle}}" data-id="{{id}}" data-actions="tab-choose"><span class="placeholder">{{itemContent}}</span><span class="text"></span></div>',
        content: '<div class="cascader-dropdown-content clearfix">{{contentItem}}</div>',
        contentItem: '<div class="cascader-dropdown-content-box {{next}}"><ul class="cascader-dropdown-content-list clearfix">{{contentItemList}}</ul></div>',
        contentItemList: '<li class="{{itemListStyle}} {{disabled}}" {{haspopup}} data-id="{{id}}" data-value="{{value}}" data-label="{{label}}" data-actions="{{itemListStyle}}">{{itemContent}}</li>',
        footer: '<div class="cascader-dropdown-footer"><button type="button" class="btn btn-default btn-sm" data-actions="cancel">取消</button><button type="button" disabled class="btn btn-primary btn-sm" data-actions="sure">确定</button></div>'
    }

    Cascader.LISTTEMPLATE = {
        radio: '<div class="radio"><label class="radio-card {{disabled}}"><input name="{{name}}" {{disabled}} type="radio"><span class="text-label">{{label}}</span></label></div>',
        checkbox: '<div class="checkbox"><label class="checkbox-card {{disabled}}"><input name="{{name}}" {{disabled}} type="checkbox"><span class="text-label">{{label}}</span></label></div>',
        list: '<span>{{label}}</span>',
        arrow: '<span class="list-item-arrow aidicon aidicon-chevron-right"></span>',
        checked: '<span class="list-item-checked aidicon aidicon-check"></span>',
        listAll: '<li class="list-item check-all" data-value="all-item" data-label="all-item" data-actions="chooseAll"><span>全部</span><span class="list-item-checked aidicon aidicon-check"></span></li>',
        checkAll: '<li class="list-default check-all" data-value="all-item" data-label="all-item"><div class="checkbox"><label class="checkbox-card"><input name="all-item" class="check-all" type="checkbox" data-actions="chooseAll"><span class="text-label">全部</span></label></div></li>'
    }

    // 主样式
    Cascader.MAINSTYLE = {
        cascaderStyle: 'cascader',
        cascaderListStyle: 'cascader-list',
        Style: 'cascader-dropdown',
        ListStyle: 'cascader-dropdown-list',
        placeholder: 'placeholder',
        disabled: 'disabled',
        tabStyle: 'cascader-dropdown-tab-item'
    }

    // 大小样式
    Cascader.SIZESTYLE = {
        'large': 'cascader-lg',
        'medium': '',
        'small': 'cascader-sm'
    }

    // 修饰样式
    Cascader.EMBELLISHSTYLE = {
        openStyle: 'open',
        nextStyle: 'next',
        activeStyle: 'active',
        checkedStyle: 'checked',
        hasPopup: 'data-haspopup="true"',
        listDefault: 'list-default',
        listDefaultLg: 'list-default-lg',
        listItem: 'list-item',
        ellipsis: 'ellipsis'
    }

    // 修饰样式
    Cascader.ANIMATIONTIME = {
        up: 0
    }

    /**
     * type: default | list
     * placeholder: 输入框占位文本,
     * isMultiple: 是否支持多选，
     * disabled: 是否禁用
     * tabData:[
     *    {
     *       placeholder: tab占位文本,
     *   }
     * ]
     * data:[
     *  {
     *      id:'',
     *      value:'',
     *      label:'',
     *      disabled:'',
     *      children:[
     *          {
     *              value:'',
     *              label:'',
     *              disabled:''
     *          }
     *      ]
     *  }
     * ]
     * **/
    Cascader.DEFAULTS = {
        type: 'default',
        placeholder: '请选择...',
        disabled: false,
        isMultiple: false,
        size: 'medium',
        inputValue: '',
        tabData: [],
        data: []
    }

    // 初始化
    Cascader.prototype.init = function (type, element, options) {
        this.type = type;
        this.cache = {};
        this.$element = $(element);
        this.options = this.getOptions(options);
        this.isListType = this.getStyleType(options);
        this.$element.html(this.getTemplate(this.options));
        this.initEvent();
    }

    // 绑定Cascader Event
    Cascader.prototype.initEvent = function () {
        this.$element.on('click.bs.Cascader.closeLabel.data-api', closeLabel, this, this.closeLabel);
        this.$element.on('click.bs.Cascader.cascaderToggle.data-api', this.toggle);
        $(document).on('click.bs.Cascader.closeDrop.data-api', this.closeDrop);
    }

    // 初始化Dropdown
    Cascader.prototype.initDropdown = function ($this) {
        var timer = getAbsoluteSecond();
        this.options.dataId = this.type + '' + timer;
        $this.drop = $this.data('bs.cascaderDropdown', this.options.dataId);
        var dropTemplate = this.getDropdownTemplate(this.options);

        $('body').append(dropTemplate);

        if (!this.isListType) setCascaderDropdownWidth($(".cascader-dropdown[data-id = '" + this.options.dataId + "']"), this.isListType)

        getDropdownPosition.call(this, $this, this.options.dataId);
        var id = getDropdownByDataId(this.options.dataId);
        this.setDropdownValue($(id));
        this.initDropdownEvent(id);
    }

    // 绑定Dropdown Event
    Cascader.prototype.initDropdownEvent = function (id) {
        $(document).on('click.bs.Cascader.labelChoose.data-api', id + ' ' + labelChoose, this, this.chooseItemEvent);
        $(document).on('click.bs.Cascader.listChoose.data-api', id + ' ' + listChoose, this, this.chooseItemEvent);
        $(document).on('click.bs.Cascader.tabChoose.data-api', id + ' ' + tabChoose, this, this.clickTabEvent);
        $(document).on('click.bs.Cascader.chooseAll.data-api', id + ' ' + chooseAll, this, this.chooseAllEvent);
        $(document).on('click.bs.Cascader.btnSure.data-api', id + ' ' + btnSure, this, this.btnSure);
        $(document).on('click.bs.Cascader.btnCancel.data-api', id + ' ' + btnCancel, this, this.btnCancel);
    }

    // 初始化Dropdown
    Cascader.prototype.toggleSelfDropdown = function ($this) {
        var isActive = $this.hasClass(Cascader.EMBELLISHSTYLE.openStyle);
        var $id = $(getDropdownByDataId($this.drop));

        if (isActive) {
            // $id.slideUp(Cascader.ANIMATIONTIME.up);
            $id.hide();
            $this.removeClass(Cascader.EMBELLISHSTYLE.openStyle);
        } else {
            getDropdownPosition.call(this, $this, $this.drop);
        }

        this.setDropdownValue($id);
    }

    Cascader.prototype.getDefaults = function () {
        return Cascader.DEFAULTS
    }

    Cascader.prototype.getOptions = function (options) {
        options = $.extend({}, this.getDefaults(), this.$element.data(), options)
        return options
    }

    // 设置类名
    Cascader.prototype.setTemplateClass = function () {
        var str = '';
        Array.prototype.slice.apply(arguments).map(function (t) {
            if (t != '')
                str += t + ' ';
        })
        return str;
    }

    // 解析Style
    Cascader.prototype.getTemplateClass = function (options, type) {
        var s = '';
        var t = type ? type : '';
        var bool = (this.type === t && !options.isMultiple);
        s = this.setTemplateClass(Cascader.MAINSTYLE[t + 'Style'], Cascader.SIZESTYLE[options.size], this.isListType ? Cascader.MAINSTYLE[t + 'ListStyle'] : '', options.disabled ? Cascader.MAINSTYLE.disabled : '', options.placeholder ? Cascader.MAINSTYLE.placeholder : '', bool ? Cascader.EMBELLISHSTYLE.ellipsis : '');
        return s
    }

    Cascader.prototype.getTemplate = function (options) {
        return this.getCascaderTemplate(options);
    }

    // 点击下拉事件
    Cascader.prototype.toggle = function (e) {
        var $this = $(this)
        var $target = $this.find('.' + Cascader.MAINSTYLE.cascaderStyle)
        var self = $this.data('bs.cascader')

        if ($target.is('.disabled, :disabled')) return

        if (self.options) self.toggleDropdown($target)
    }

    // 下拉框展开事件
    Cascader.prototype.toggleDropdown = function ($this) {
        $this.drop = $this.data('bs.cascaderDropdown');
        $this.drop ? this.toggleSelfDropdown($this) : this.initDropdown($this)
    }

    // 点击其他区域关闭下拉框
    Cascader.prototype.closeDrop = function (e) {
        if ($(e.target).closest('.cascader-dropdown').length == 0 && $(e.target).closest('.cascader').length == 0) {
            // $('.cascader-dropdown').slideUp(Cascader.ANIMATIONTIME.up);
            $('.cascader-dropdown').hide();
            $('.cascader').removeClass('open');
        }
    }

    // 点击输入框多选项关闭事件
    Cascader.prototype.closeLabel = function (e) {
        e.stopPropagation();
        e.preventDefault();

        var self = e.data;
        var $this = $(this);
        var $item = $this.closest('.label');
        var $parent = $item.closest('.cascader-text');
        var $closest = $parent.closest('.cascader');
        var dropId = $closest.data('bs.cascaderDropdown');
        var $id = $(getDropdownByDataId(dropId));

        self.beforeCloseLabel($item);

        $this.closest('.label').remove();

        // 点击关闭要更新数据
        var arr = [];
        $parent.find('.label').each(function () {
            var id = $(this).attr('data-id');
            arr.push(id);
        });

        self.setChoosedData(arr);
        self.setDropdownValue($id);
        if (arr.length == 0) self.cleanInput($parent);

        self.afterCloseLabel($parent);

        return false
    }

    // 清除输入框
    Cascader.prototype.cleanInput = function ($id) {
        $id.closest('.cascader').addClass(Cascader.MAINSTYLE.placeholder).find('.cascader-text').html(this.options.placeholder)
    }

    /**
     * 功能：点击选项事件
     *
     * **/
    Cascader.prototype.chooseItemEvent = function (e) {
        var $this = $(this)
        var self = e.data

        self.chooseItem($this);
        if ($this.is('.disabled, :disabled')) return;
        self.chooseItemChange($this);
        self.choosedItem($this);
    }


    /**
     * 功能：点击选项事件处理
     * 参数：$this：被点击的选项
     *
     * **/
    Cascader.prototype.chooseItemChange = function ($this) {
        var $this = !this.isListType ? $this.closest('li') : $this;
        var hasPopup = $this.attr('data-haspopup');

        hasPopup ? this.openNextContent($this) : this.chooseItemOption($this)
    }


    /**
     * 功能：打开新的页签
     * 参数：$this：被点击的选项
     *
     * **/
    Cascader.prototype.openNextContent = function ($this) {
        var id = $this.attr('data-id');
        var options = this.options;
        var $box = $this.closest('.cascader-dropdown-content');
        var $parent = $this.closest('.cascader-dropdown-content-box');
        var $footer = $this.closest('.cascader-dropdown').find('.cascader-dropdown-footer');

        $parent.find('li').removeClass(Cascader.EMBELLISHSTYLE.activeStyle);
        $this.addClass(Cascader.EMBELLISHSTYLE.activeStyle);

        var children = this.getChildrenForId(id, options.data);

        var contentItem = this.getDropdownContent(children, Cascader.EMBELLISHSTYLE.nextStyle, id).contentItem;

        $parent.nextAll('.cascader-dropdown-content-box').remove();
        $box.append(contentItem);

        // 如果是默认tab页签选择
        if (!this.isListType) {
            this.setTabData($this);
            $this.closest('.cascader-dropdown-content-box').hide()
        } else {
            var $id = $this.closest('.cascader-dropdown');
            setCascaderDropdownWidth($id, this.isListType);
            setPosition(this.$element.find('.cascader'), $id);
        }

        if (options.isMultiple) $footer.find('.btn-primary').attr('disabled', true)
    }

    /**
     * 功能：设置标签页数据
     * 参数：$this：被点击的选项
     *
     * **/
    Cascader.prototype.setTabData = function ($this) {
        var $closest = $this.closest('.cascader-dropdown');
        var index = $this.closest('.cascader-dropdown-content-box').index();
        var $self = $closest.find('.cascader-dropdown-tab .cascader-dropdown-tab-item').eq(index);
        var id = $this.attr('data-id');
        var text = $this.find('.text-label').text();
        var hasPopup = $this.attr('data-haspopup');
        var options = this.options;

        if (hasPopup) {
            $self.attr('data-id', id).removeClass('active');
            $self.find('.text').html(text).show();
            $self.find('.placeholder').hide();
            $self.nextAll().addClass('disabled').find('.text').html('').hide();
            $self.nextAll().find('.placeholder').show();
            $self.next().addClass('active').removeClass('disabled')
        } else {
            if (!options.isMultiple) {
                $self.html(text)
            }
        }
    }

    /**
     * 功能：点击选项
     * 参数：$this：被点击的选项
     *
     * **/
    Cascader.prototype.chooseItemOption = function ($this) {
        var options = this.options;
        var $parent = $this.closest('.cascader-dropdown-content-box');

        if (options.isMultiple) {
            if ($this.hasClass(Cascader.EMBELLISHSTYLE.checkedStyle)) {
                $this.removeClass(Cascader.EMBELLISHSTYLE.checkedStyle);
            } else {
                $this.addClass(Cascader.EMBELLISHSTYLE.checkedStyle);
            }

            this.setBtnSureState($this);
            this.setAllCheckedState($this)
        } else {
            $parent.find('li').removeClass(Cascader.EMBELLISHSTYLE.checkedStyle);
            $this.addClass(Cascader.EMBELLISHSTYLE.checkedStyle);
            this.getCheckedEvent($this)
        }
    }

    /**
     * 功能：获得被选中的id
     * 参数：$this：被点击的选项
     *
     * **/
    Cascader.prototype.getCheckedEvent = function ($this) {
        var obj = this.getCheckedData($this);
        var $closest = $this.closest('.cascader-dropdown');

        // $closest.slideUp(Cascader.ANIMATIONTIME.up);
        $closest.hide();
        this.$element.find('.cascader').removeClass('placeholder open').find('.cascader-text').html(this.setCascaderValue(obj, this.options));
    }

    /**
     * 功能：获得被选中的id
     * 参数：$this：被点击的选项
     *
     * **/
    Cascader.prototype.getCheckedData = function ($this) {
        var items = this.getCheckedItem($this), arr = [];

        items.each(function () {
            arr.push($(this).attr('data-id'));
        })

        this.setChoosedData(arr);
        return arr.join(',');
    }

    /**
     * 功能：获得被选中的选项
     * 参数：$this：被点击的选项
     *
     * **/
    Cascader.prototype.getCheckedItem = function ($this) {
        return $this.closest('.cascader-dropdown').find('.cascader-dropdown-content-list li:not(".check-all").checked');
    }

    /**
     * 功能：获得被选中的选项
     * 参数：$this：被点击的选项
     *
     * **/
    Cascader.prototype.setBtnSureState = function ($this) {
        var $footer = $this.closest('.cascader-dropdown').find('.cascader-dropdown-footer');
        var $items = this.getCheckedItem($this);
        if ($items.length > 0) {
            $footer.find('.btn-primary').attr('disabled', false)
        } else {
            $footer.find('.btn-primary').attr('disabled', true)
        }
    }

    /**
     * 功能：设置全选是否要被选中
     * 参数：$this：被点击的选项
     *
     * **/
    Cascader.prototype.setAllCheckedState = function ($this) {
        var $parent = $this.closest('.cascader-dropdown-content-list');
        var $items = $parent.find('li:not(".check-all"):not(".disabled"):not(".checked")');
        if ($items.length <= 0) {
            $parent.find('li.check-all').addClass('checked').find('label input').prop('checked', true)
        } else {
            $parent.find('li.check-all').removeClass('checked').find('label input').prop('checked', false)
        }
    }

    /**
     * 功能：点击全选按钮事件处理
     *
     * **/
    Cascader.prototype.chooseAllEvent = function (e) {
        var $this = $(this);
        var self = e.data;

        var $parent = $this.closest('.cascader-dropdown-content-list');
        var isCheckBox = $this.closest('.checkbox').length > 0;

        if (isCheckBox) {
            if (this.checked) {
                $parent.find('label input:not(:disabled)').prop('checked', true);
                $parent.find('.list-default:not(".disabled")').addClass('checked');
            } else {
                $parent.find('label input:not(:disabled)').prop('checked', false);
                $parent.find('.list-default:not(".disabled")').removeClass('checked');
            }
        } else {
            if (!$this.hasClass('checked')) {
                $parent.find('.list-item:not(".disabled")').addClass('checked');
            } else {
                $parent.find('.list-item:not(".disabled")').removeClass('checked');
            }
        }
        self.setBtnSureState($this);
    }

    /**
     * 功能：点击tab事件处理
     *
     * **/
    Cascader.prototype.clickTabEvent = function (e) {
        e.stopPropagation();
        e.preventDefault();
        var $this = $(this)
        if ($this.is('.disabled, :disabled')) return

        var $closest = $this.closest('.cascader-dropdown');
        $closest.find('.cascader-dropdown-tab-item').removeClass('active');
        var index = $this.closest('.cascader-dropdown-tab-item').addClass('active').index();
        $closest.find('.cascader-dropdown-content .cascader-dropdown-content-box').hide().eq(index).show();
    }

    // 解析 Cascader dom 结构
    Cascader.prototype.getCascaderTemplate = function (options) {
        var obj = options.inputValue,
            opt = $.extend(true, {}, options),
            cascaderStyle = '',
            cascaderContent = '',
            newObj = {};

        if (obj) {
            cascaderContent = this.setCascaderValue(obj, opt);
            if (!cascaderContent) {
                cascaderContent = opt.placeholder
            } else {
                opt.placeholder = false;
            }
            cascaderStyle = this.getTemplateClass(opt, this.type);
        } else {
            cascaderContent = opt.placeholder;
            cascaderStyle = this.getTemplateClass(opt, this.type);
        }

        newObj.cascaderStyle = cascaderStyle;
        newObj.cascaderContent = cascaderContent;
        return this.setTemplate(Cascader.TEMPLATE.warp, newObj);
    }

    // 解析 tabItem dom结构
    Cascader.prototype.setCascaderValue = function (obj, opt) {
        var cascaderText = '', cascaderItem = '', self = this;

        if (!obj) return;

        var arr = obj.split(',');
        this.setChoosedData(arr);
        var parentArr = this.getParentForId(arr[0], opt.data);

        if (!parentArr) return
        var len = parentArr.length;

        if (len > 0) {

            for (var i = len - 1; i >= 0; i--) {
                cascaderText += parentArr[i].label + ' / ';
            }

            if (parentArr[0].children) {
                if (opt.isMultiple) {
                    arr.map(function (t) {
                        var obj = self.getDataForId(t, parentArr[0].children);
                        cascaderItem += self.setTemplate(Cascader.TEMPLATE.checkItem, {
                            id: obj.id,
                            cascaderItem: obj.label
                        })
                    });
                } else {
                    if (arr.length > 0) {
                        var obj = self.getDataForId(arr[0], parentArr[0].children);
                        cascaderItem = obj.label;
                    }

                }
            }
        }
        return cascaderText + cascaderItem;
    }

    /**
     * 功能：通过id得到父级对象组
     * 参数: {
     *      id:传入的id
     *      data：数组对象
     * }
     *
     * **/
    Cascader.prototype.getParentForId = function (sid, data) {
        var parentArr = null, parentId = [];

        if (!sid && !data) return;

        var getParentFun = function (id, d, obj) {
            for (var i = 0, len = d.length; i < len; i++) {
                if (d[i].id != id) {
                    if (!!d[i].children) getParentFun(id, d[i].children, d[i])
                } else {
                    if (obj) {
                        parentId.push(obj);
                        getParentFun(obj.id, data)
                    } else {
                        parentArr = JSON.parse(JSON.stringify(parentId))
                    }
                    break;
                }
            }
        };

        getParentFun(sid, data);
        return parentArr;
    }

    /**
     * 功能：通过id得到数据
     * 参数：{
     *      id：传入的id
     *      data：传入的数据
     * }
     *
     *
     * **/
    Cascader.prototype.getDataForId = function (sid, data) {
        var obj = null;

        if (!sid && !data) return;

        data.map(function (t) {
            if (t.id == sid) obj = t;
        });

        return obj;
    }

    /**
     * 功能：通过id得到数据
     * 参数：{
     *      id：传入的id
     *      data：传入的数据
     * }
     *
     * **/
    Cascader.prototype.getChildrenForId = function (sid, data) {
        var arr = null;

        if (!sid && !data) return;

        var getChildren = function (id, d) {

            for (var i in d) {
                if (d[i].id == id) {
                    arr = d[i].children;
                    break;
                } else {
                    getChildren(id, d[i].children)
                }
            }
        };

        getChildren(sid, data);

        return arr;
    }


    /**
     * 设置下拉默认值
     * **/
    Cascader.prototype.setDropdownValue = function ($id) {
        var arr = this.getChoosedData(), self = this, opt = $.extend(true, {}, self.options), $this, $parent;

        if (!arr) return

        var parentArr = this.getParentForId(arr[0], opt.data);
        if (!parentArr) {
            var footer = opt.isMultiple ? this.getDropdownFooter() : '';
            var warp = this.getDropdownWarp(opt);
            $id.html(warp + footer);
            setCascaderDropdownWidth($id, self.isListType);
            return;
        }

        var len = parentArr.length;

        for (var i = len - 1; i >= 0; i--) {
            $parent = $id.find('.cascader-dropdown-content-box').eq(len - 1 - i);
            $this = $parent.find('.cascader-dropdown-content-list li[data-id="' + parentArr[i].id + '"]');
            self.chooseItemChange($this);

            if (i == 0) self.setItemVale($id, arr);
        }
    }

    /**
     * 设置下拉最终选项
     * **/
    Cascader.prototype.setItemVale = function ($id, arr) {
        var $parent = $id.find('.cascader-dropdown-content-box:last-child'), self = this;
        for (var i = 0, len = arr.length; i < len; i++) {
            var $this = $parent.find('.cascader-dropdown-content-list li[data-id="' + arr[i] + '"]');
            $this.addClass('checked').find('label input').prop('checked', true);
            self.setBtnSureState($this);
            self.setAllCheckedState($this);
        }
    }

    /**
     * 解析cascader-dropdown结构
     * Dropdown 的 data 结构
     *
     * **/
    Cascader.prototype.getDropdownTemplate = function (options, data) {
        var obj = data ? data : {},
            warp,
            footer,
            newObj = {},
            opt = $.extend(true, {}, options);

        opt.data = $.extend(true, opt.data, obj);
        footer = options.isMultiple ? this.getDropdownFooter() : '';
        warp = this.getDropdownWarp(opt);

        newObj.dropdownStyle = this.getTemplateClass(opt);
        newObj.dataId = options.dataId;
        newObj.dropdownContent = warp + footer;
        return this.setTemplate(Cascader.DROPTEMPLATE.warp, newObj);
    }

    // 解析 Dropdown dom结构
    Cascader.prototype.getDropdownWarp = function (options) {
        var tab = '', content = '', warp = '', tabData = options.tabData.concat(), data = options.data.concat();

        tab = this.isListType ? '' : this.setTemplate(Cascader.DROPTEMPLATE.tab, this.getDropdownTab(tabData));
        content = this.setTemplate(Cascader.DROPTEMPLATE.content, this.getDropdownContent(data));
        return warp = tab + content;
    }

    // 解析 DropdownContent tab dom结构
    Cascader.prototype.getDropdownTab = function (data) {
        var newObj = {}, self = this;

        newObj.tabList = '';
        data.map(function (d, index) {
            var obj = {};
            obj.id = d.id || '';
            obj.tabStyle = index == 0 ? Cascader.EMBELLISHSTYLE.activeStyle : !d ? Cascader.MAINSTYLE.disabled : !d.label ? Cascader.MAINSTYLE.disabled : Cascader.EMBELLISHSTYLE.activeStyle;
            obj.itemContent = !d ? Cascader.DEFAULTS.placeholder : !d.placeholder ? Cascader.DEFAULTS.placeholder : d.placeholder;

            newObj.tabList += self.setTemplate(Cascader.DROPTEMPLATE.tabList, obj);
        });

        return newObj;
    }

    // 解析 DropdownContent dom结构
    Cascader.prototype.getDropdownContent = function (data, next, pid) {
        var newObj = {}, obj = {};
        var itemList = this.getItemList(data, pid);
        var checkAll = !this.cache.checkAll ? '' : this.isListType ? Cascader.LISTTEMPLATE.listAll : Cascader.LISTTEMPLATE.checkAll;

        obj.next = next ? next : '';
        obj.contentItemList = checkAll + itemList;
        newObj.contentItem = this.setTemplate(Cascader.DROPTEMPLATE.contentItem, obj);
        return newObj;
    }

    // 解析 DropdownContentItemList dom结构
    Cascader.prototype.getItemList = function (data, pid) {
        var contentItem = '',
            data = data.concat(),
            self = this;

        data.map(function (d) {
            var obj = {};

            obj.id = d.id;
            obj.value = d.value;
            obj.label = d.label;
            obj.itemContent = self.getContentItem(d, pid);
            obj.disabled = d.disabled ? Cascader.MAINSTYLE.disabled : '';
            obj.haspopup = self.hasDataArray(d.children) ? Cascader.EMBELLISHSTYLE.hasPopup : '';
            obj.itemListStyle = self.isListType ? Cascader.EMBELLISHSTYLE.listItem : d.label.length <= 5 ? Cascader.EMBELLISHSTYLE.listDefault : self.setTemplateClass(Cascader.EMBELLISHSTYLE.listDefault, Cascader.EMBELLISHSTYLE.listDefaultLg);
            contentItem += self.setTemplate(Cascader.DROPTEMPLATE.contentItemList, obj);
        });

        return contentItem;
    }

    /**
     * 功能：解析 DropdownContentItem dom结构
     * 参数：data：传入的选项的数据
     *
     * **/
    Cascader.prototype.getContentItem = function (data, pid) {
        var itemContent = '', obj = {}, options = this.options, pid = pid || '';

        this.cache.checkAll = false;
        obj.label = data.label;

        this.cache.checkAll = options.isMultiple && !this.hasDataArray(data.children) ? true : false;

        if (this.isListType) {
            itemContent = this.setTemplate(Cascader.LISTTEMPLATE.list, obj) + (this.hasDataArray(data.children) ? Cascader.LISTTEMPLATE.arrow : Cascader.LISTTEMPLATE.checked);
        } else {
            obj.name = options.dataId + '-' + pid;
            obj.disabled = data.disabled ? Cascader.MAINSTYLE.disabled : '';
            itemContent = options.isMultiple && !this.hasDataArray(data.children) ? this.setTemplate(Cascader.LISTTEMPLATE.checkbox, obj) : this.setTemplate(Cascader.LISTTEMPLATE.radio, obj);
        }

        return itemContent;
    }

    /**
     * 判断是否为长度大于0数组
     * **/
    Cascader.prototype.hasDataArray = function (d) {
        var bool = false,
            data = d ? d : [];
        if ($.isArray(data)) return data.length;
        return bool;
    }

    /**
     * 保存已选中的数据
     * **/
    Cascader.prototype.setChoosedData = function (arr) {
        this.cache.choosedData = arr
    }

    /**
     * 获取已选中的数据
     * **/
    Cascader.prototype.getChoosedData = function () {
        return this.cache.choosedData
    }

    /**
     * 获取已选中的数据
     * **/
    Cascader.prototype.getParentsForId = function (id) {
        return this.getParentForId(id, this.options.data)
    }

    // 判断级联类型
    Cascader.prototype.getStyleType = function (options) {
        return options.type === 'list' ? true : false
    }

    // 解析 DropdownFooter dom结构
    Cascader.prototype.getDropdownFooter = function () {
        return Cascader.DROPTEMPLATE.footer;
    }

    // 多选确认按钮事件
    Cascader.prototype.btnSure = function (e) {
        var self = e.data;
        self.setActionSure($(this));
        self.getCheckedEvent($(this));
        self.setActionSured($(this));
    }

    // 多选取消按钮事件
    Cascader.prototype.btnCancel = function (e) {
        var self = e.data;
        self.setActionCancel($(this));
        $(this).closest('.cascader-dropdown').hide();
        self.$element.find('.cascader').removeClass('open');
        self.setActionCanceled($(this));
    }

    // 选项被选中前
    Cascader.prototype.chooseItem = function ($this) {
        var actionEvent = $.Event('item.choose.bs.cascader');
        this.$element.trigger(actionEvent, $this);
    }

    // 选项被选中后
    Cascader.prototype.choosedItem = function ($this) {
        var actionEvent = $.Event('item.chosen.bs.cascader');
        this.$element.trigger(actionEvent, $this);
    }

    // 底部确定按钮事件前
    Cascader.prototype.setActionSure = function ($this) {
        var actionEvent = $.Event('sure.click.bs.cascader');
        this.$element.trigger(actionEvent, $this);
    }

    // 底部确定按钮事件后
    Cascader.prototype.setActionSured = function ($this) {
        var actionEvent = $.Event('sure.clicked.bs.cascader');
        this.$element.trigger(actionEvent, $this);
    }

    // 底部取消按钮事件前
    Cascader.prototype.setActionCancel = function ($this) {
        var actionEvent = $.Event('cancel.click.bs.cascader');
        this.$element.trigger(actionEvent, $this);
    }

    // 底部取消按钮事件后
    Cascader.prototype.setActionCanceled = function ($this) {
        var actionEvent = $.Event('cancel.clicked.bs.cascader');
        this.$element.trigger(actionEvent, $this);
    }

    // 底部取消按钮事件前
    Cascader.prototype.beforeCloseLabel = function ($item) {
        var actionEvent = $.Event('before.close.label.bs.cascader');
        this.$element.trigger(actionEvent, $item);
    }

    // 底部取消按钮事件后
    Cascader.prototype.afterCloseLabel = function ($parent) {
        var actionEvent = $.Event('after.close.label.bs.cascader');
        this.$element.trigger(actionEvent, $parent);
    }

    // Template Format
    Cascader.prototype.setTemplate = function (str, model) {
        for (var v in model) {
            var reg = new RegExp("{{" + v + "}}", "g");
            str = str.replace(reg, model[v]);
        }
        return str
    }


    // CASCADER PLUGIN DEFINITION
    // =========================

    function Plugin(option, obj) {
        if (/^get/.test(option)) {
            var $this = $(this)
            var data = $this.data('bs.cascader');
            return data[option](obj)
        }
        return this.each(function () {
            var $this = $(this)
            var data = $this.data('bs.cascader')
            var options = typeof option == 'object' && option

            if (!data) $this.data('bs.cascader', (data = new Cascader(this, options)))
            if (typeof option == 'string') data[option](obj)
        })
    }

    var old = $.fn.cascader

    $.fn.cascader = Plugin
    $.fn.cascader.Constructor = Cascader


    // CASCADER NO CONFLICT
    // ===================

    $.fn.cascader.noConflict = function () {
        $.fn.cascader = old
        return this
    }

}(jQuery);
},{}],10:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: collapse.js v3.3.7
 * http://getbootstrap.com/javascript/#collapse
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

/* jshint latedef: false */

+function ($) {
  'use strict';

  // COLLAPSE PUBLIC CLASS DEFINITION
  // ================================

  var Collapse = function (element, options) {
    this.$element      = $(element)
    this.options       = $.extend({}, Collapse.DEFAULTS, options)
    this.$trigger      = $('[data-toggle="collapse"][href="#' + element.id + '"],' +
                           '[data-toggle="collapse"][data-target="#' + element.id + '"]')
    this.transitioning = null

    if (this.options.parent) {
      this.$parent = this.getParent()
    } else {
      this.addAriaAndCollapsedClass(this.$element, this.$trigger)
    }

    if (this.options.toggle) this.toggle()
  }

  Collapse.VERSION  = '3.3.7'

  Collapse.TRANSITION_DURATION = 350

  Collapse.DEFAULTS = {
    toggle: true
  }

  Collapse.prototype.dimension = function () {
    var hasWidth = this.$element.hasClass('width')
    return hasWidth ? 'width' : 'height'
  }

  Collapse.prototype.show = function () {
    if (this.transitioning || this.$element.hasClass('in')) return

    var activesData
    var actives = this.$parent && this.$parent.children('.panel').children('.in, .collapsing')

    if (actives && actives.length) {
      activesData = actives.data('bs.collapse')
      if (activesData && activesData.transitioning) return
    }

    var startEvent = $.Event('show.bs.collapse')
    this.$element.trigger(startEvent)
    if (startEvent.isDefaultPrevented()) return

    if (actives && actives.length) {
      Plugin.call(actives, 'hide')
      activesData || actives.data('bs.collapse', null)
    }

    var dimension = this.dimension()

    this.$element
      .removeClass('collapse')
      .addClass('collapsing')[dimension](0)
      .attr('aria-expanded', true)

    this.$trigger
      .removeClass('collapsed').addClass('openChildren')
      .attr('aria-expanded', true)
      this.$trigger.find('.right-icon').hasClass('caret-up') ?
      this.$trigger.find('.right-icon').removeClass('caret-up').addClass(' caret-down') :
      this.$trigger.find('.right-icon').removeClass('caret-down').addClass('caret-up');
      this.$trigger.find('a').addClass('active')

    this.transitioning = 1

    var complete = function () {
      this.$element
        .removeClass('collapsing')
        .addClass('collapse in')[dimension]('')
      this.transitioning = 0
      this.$element
        .trigger('shown.bs.collapse')
    }

    if (!$.support.transition) return complete.call(this)

    var scrollSize = $.camelCase(['scroll', dimension].join('-'))

    this.$element
      .one('bsTransitionEnd', $.proxy(complete, this))
      .emulateTransitionEnd(Collapse.TRANSITION_DURATION)[dimension](this.$element[0][scrollSize])
  }

  Collapse.prototype.hide = function () {
    if (this.transitioning || !this.$element.hasClass('in')) return

    var startEvent = $.Event('hide.bs.collapse')
    this.$element.trigger(startEvent)
    if (startEvent.isDefaultPrevented()) return

    var dimension = this.dimension()

    this.$element[dimension](this.$element[dimension]())[0].offsetHeight

    this.$element
      .addClass('collapsing')
      .removeClass('collapse in')
      .attr('aria-expanded', false)

    this.$trigger
      .removeClass('openChildren').addClass('collapsed')
      .attr('aria-expanded', false)
    this.$trigger.find('.right-icon').hasClass('caret-up') ?
    this.$trigger.find('.right-icon').removeClass('caret-up').addClass(' caret-down') :
    this.$trigger.find('.right-icon').removeClass('caret-down').addClass('caret-up');
    this.$trigger.find('a').removeClass('active')

    this.transitioning = 1

    var complete = function () {
      this.transitioning = 0
      this.$element
        .removeClass('collapsing')
        .addClass('collapse')
        .trigger('hidden.bs.collapse')
    }

    if (!$.support.transition) return complete.call(this)

    this.$element
      [dimension](0)
      .one('bsTransitionEnd', $.proxy(complete, this))
      .emulateTransitionEnd(Collapse.TRANSITION_DURATION)
  }

  Collapse.prototype.toggle = function () {
    this[this.$element.hasClass('in') ? 'hide' : 'show']()
  }

  Collapse.prototype.getParent = function () {
    return $(this.options.parent)
      .find('[data-toggle="collapse"][data-parent="' + this.options.parent + '"]')
      .each($.proxy(function (i, element) {
        var $element = $(element)
        this.addAriaAndCollapsedClass(getTargetFromTrigger($element), $element)
      }, this))
      .end()
  }

  Collapse.prototype.addAriaAndCollapsedClass = function ($element, $trigger) {
    var isOpen = $element.hasClass('in')

    $element.attr('aria-expanded', isOpen)
    $trigger
      .toggleClass('collapsed', !isOpen)
      .attr('aria-expanded', isOpen)
  }

  function getTargetFromTrigger($trigger) {
    var href
    var target = $trigger.attr('data-target')
      || (href = $trigger.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') // strip for ie7

    return $(target)
  }


  // COLLAPSE PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.collapse')
      var options = $.extend({}, Collapse.DEFAULTS, $this.data(), typeof option == 'object' && option)

      if (!data && options.toggle && /show|hide/.test(option)) options.toggle = false
      if (!data) $this.data('bs.collapse', (data = new Collapse(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.collapse

  $.fn.collapse             = Plugin
  $.fn.collapse.Constructor = Collapse


  // COLLAPSE NO CONFLICT
  // ====================

  $.fn.collapse.noConflict = function () {
    $.fn.collapse = old
    return this
  }


  // COLLAPSE DATA-API
  // =================

  $(document).on('click.bs.collapse.data-api', '[data-toggle="collapse"]', function (e) {
    var $this   = $(this)

    if (!$this.attr('data-target')) e.preventDefault()

    var $target = getTargetFromTrigger($this)
    var data    = $target.data('bs.collapse')
    var option  = data ? 'toggle' : $this.data()

    Plugin.call($target, option)
  })

}(jQuery);

},{}],11:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: dropdown.js v3.3.7
 * http://getbootstrap.com/javascript/#dropdowns
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';
    var dropdownArr = [];
    var DropdownSelect = function (element, options) {
        this.$element = null
        this.options = null
        this.init(element, options);
    }

    DropdownSelect.VERSION = '1.0.0'


DropdownSelect.DEFAULTS = {
    // single:单选；multi: 多选
    type: 'single',
    // 点击之后是否关闭
    isMiss : true,
    placeholder: '请选择',
    //增加位置调整以满足位置之间的空隙
    offset: [0,0],
    container: null,
    // 标识class，在container不为null的情况下生效,用于找到面板新的位置
    randomClass: '',
    //设置面板的展示位置:down默认的朝下，up朝上
    panelPos: 'down'
}

DropdownSelect.VIEW = {
    SINGLEHEAD: '<span class="dropdownSelect-value"></span><a class="aidicon aidicon-chevron-down"></a> <span class="select-placeholder">请选择</span>',
    MULTIHEAD: '<ul class="dropdownSelect-multiple-ul clearfix"></ul><span class="select-multi-placeholder" style="display: block;">请选择</span>'
}

// 初始化
DropdownSelect.prototype.init = function (element, options) {
    var $menu = null,
        $el = null,
        relatedTarget = { relatedTarget: this };
        this.$el = $(element);
        $el = this.$el;
        $menu = this.$el.parent().find(".dropdownSelect-menu");
        this.$dropDownSelectPanel = $menu;
    // 设置options
    this.setOptions(options);
    if(this.options.container){
        var cloneMenu = $menu.clone();
        $menu.remove();
        $(this.options.container).append(cloneMenu);
        $menu = cloneMenu;
        this.$menu = $menu;
        this.$menu.css('right','initial');
        this.$menu.addClass(this.options.randomClass);
        this.$menu.css('min-width',this.$el.outerWidth());
    }
    this.initHead();
    this.initChecked();

    this.$el.on('click.' + this.uiName, this.$el, $.proxy(this.toggle, this));
    if(!this.options.isMiss) {
        $menu.on('click.' + this.uiName, $menu, $.proxy(this.close, this));
    }

    this.$el['options'] = this.options;
    dropdownArr.push(this.$el);
}


DropdownSelect.prototype.initChecked = function () {
    if(this.options.type === 'single'){
        this.checkedOpts = ''; 
    }else if(this.options.type === 'multi'){
        this.checkedOpts = [];
    }
}

DropdownSelect.prototype.initHead = function () {
    if(this.options.type === 'single'){
        this.$el.html(DropdownSelect.VIEW.SINGLEHEAD);
        this.$el.parent().addClass('dropdownSelect-single');
    }else if(this.options.type === 'multi'){
        var that = this;
        this.$el.html(DropdownSelect.VIEW.MULTIHEAD);
        this.$el.parent().addClass('dropdownSelect-multi');
        this.$el.on('click','.dropdownSelect-multi-input-selected .aidicon-close-line',function(e){
            var $liRemove = $(this).parent().parent(),
                value = $liRemove.attr('data-value');
                $liRemove.remove();
            // 从this.checkedOpts中移除被删除的选项
            for(var i = 0; i < that.checkedOpts.length; i ++){
                if(that.checkedOpts[i].value === value ){
                    that.checkedOpts.splice(i,1);
                }
            }
            var relatedTarget = { relatedTarget: this, checkedOpts: that.checkedOpts, value: value};
            that.$el.trigger($.Event('removen.bs.dropdownSelect', relatedTarget));
            return false;
        })
    }

    this.options.placeholder !=="请选择" && this.$el.find('.select-placeholder').html(this.options.placeholder);
}

DropdownSelect.prototype.getDefaults = function () {
    return DropdownSelect.DEFAULTS
}

DropdownSelect.prototype.setOptions = function (options) {
    this.options = $.extend({}, this.getDefaults(), options);
}

DropdownSelect.prototype.toggle = function () {
    var $el = this.$el,
        $parent = $el.parent();
    if($parent.hasClass("open")) {
        this.close();
    } else {
        this.open();
    }
}

DropdownSelect.prototype.close = function () {
    var $el = this.$el,
        $parent = $el.parent(),
        relatedTarget = { relatedTarget: this };
    if($parent.hasClass("open")) {
        // 关闭前触发
        $el.trigger($.Event('hiden.bs.dropdownSelect', relatedTarget));
        $parent.removeClass("open");
        if(this.options.container){
            this.$menu.hide();
        }
        // 关闭后触发
        $el.trigger($.Event('hidden.bs.dropdownSelect', relatedTarget));
    }
}

DropdownSelect.prototype.open = function (isTrigger) {
    var $el = this.$el,
        $parent = $el.parent(),
        location,
        height,
        relatedTarget = { relatedTarget: this };
    // 不传参数 === 传true，触发show事件
    isTrigger === undefined && (isTrigger = true)

    if($el.attr("disabled")==="disabled") {
        return;
    }
    if(!$parent.hasClass("open")) {
        $parent.removeClass("open");
         // 打开前触发
        isTrigger && $el.trigger($.Event('show.bs.dropdownSelect', relatedTarget));
        $parent.addClass("open");

        //内部自动判断边界
        location = Position.location($el, 'fixed');

        if(this.options.container){
            this.$menu.show();
            height   = this.$menu.outerHeight() + 5 + this.options.offset[1];
        }
        
        if(location.bottom < height){
            if(this.options.container === 'body'){
                this.setBodyPosition();
            }else{
                $parent.addClass('dropdownSelect-top');
                this.setPosition();
            }
        }else{
            $parent.removeClass('dropdownSelect-top');
            this.setPosition();
        }
         // 打开后触发
        isTrigger && $el.trigger($.Event('shown.bs.dropdownSelect', relatedTarget));
    }
}


DropdownSelect.prototype.setPosition = function (options) {
    if(this.options.container){
        var parentPos = $(this.options.container).offset();
        var triggerPos = this.$el.offset();
        var pos = {};
        pos.top = triggerPos.top - parentPos.top + this.$el.outerHeight() + this.options.offset[1];
        pos.left = triggerPos.left - parentPos.left + this.options.offset[0];
        this.$menu.css('width',this.$el.outerWidth()-2 + 'px');
        this.$menu.css(pos);
    }else{
        if(this.options.panelPos == 'up'){
            var pos = {};
            pos.top = -(this.$dropDownPanel.outerHeight() + this.options.offset[1] + 5) + "px";
            this.$dropDownPanel.css(pos);
        }
    }
}

DropdownSelect.prototype.setBodyPosition = function (options) {
    var parentPos = $(this.options.container).offset();
    var triggerPos = this.$el.offset();
    var pos = {};
    pos.top = triggerPos.top - parentPos.top - this.$menu.outerHeight() - this.options.offset[1]-5;
    pos.left = triggerPos.left - parentPos.left + this.options.offset[0];
    this.$menu.css('width',this.$el.outerWidth()-2 + 'px');
    this.$menu.css(pos);
}

// 单选传递字符串；多选传递数组
DropdownSelect.prototype.setChecked = function (checkedOpt) {
    if(this.options.type === 'single'){
        this.$el.find('.select-placeholder').css('display','none');
        this.checkedOpts = checkedOpt; 
        for(var key in checkedOpt){
            if(key === 'text'){
                this.$el.find('.dropdownSelect-value').html(this.checkedOpts[key]);
            }else{
                this.$el.find('.dropdownSelect-value').attr('data-'+key,checkedOpt[key]);
            }
        }
    }else if(this.options.type === 'multi'){
        // 传入空数组直接清空
        if(checkedOpt.length === 0){
            this.clear();
            return false;
        }
        this.$el.find('.select-multi-placeholder').css('display','none');
        this.checkedOpts = checkedOpt;
        this.$el.find('.dropdownSelect-multiple-ul').html('');
        for(var i = 0; i < checkedOpt.length; i++){
            var $choseLi = $('<li class="dropdownSelect-multi-input-selected"></li>');
            for(var key in checkedOpt[i]){
                if(key === 'text'){
                    $choseLi.html('<span class="label label-default">' + checkedOpt[i][key]+'<span class="aidicon aidicon-close-line"></span></span>');
                }else{
                    $choseLi.attr('data-'+key,checkedOpt[i][key]);
                }
            }
            this.$el.find('.dropdownSelect-multiple-ul').append($choseLi);
        }
    }
    this.$el.parent('.dropdownSelect').hasClass('open') && this.open(false);
}


DropdownSelect.prototype.getChecked = function () {
        return this.checkedOpts; 
}

DropdownSelect.prototype.clear = function () {
    if(this.options.type === 'single'){
        this.checkedOpts = {}; 
        this.$el.find('.dropdownSelect-value').parent().html('<span class="dropdownSelect-value"></span><a class="aidicon aidicon-chevron-down"></a> <span class="select-placeholder">请选择</span>');
    }else if(this.options.type === 'multi'){
        this.checkedOpts = [];
        this.$el.find('.dropdownSelect-multiple-ul').parent().html('<ul class="dropdownSelect-multiple-ul clearfix"></ul><span class="select-multi-placeholder" style="display: block;">请选择</span>');
    }
    this.$el.find('.select-placeholder').html(this.options.placeholder);
    this.$el.parent('.dropdownSelect').hasClass('open') && this.open(false);
}

function Plugin(option, obj) {
    if( /^get/.test(option) && obj === undefined){
        var $this = $(this)
        var data = $this.data('bs.dropdownSelect');
        return data[option](obj)
    }

    return this.each(function () {
        var $this = $(this)
        var data = $this.data('bs.dropdownSelect')
        var options = typeof option == 'object' && option

        if (!data) $this.data('bs.dropdownSelect', (data = new DropdownSelect(this, options)))
        if (typeof option == 'string') data[option](obj)
    })
}

$(document).on("click.bs.dropdownSelect",function(e) {
    var $target = $(e.target),
        closeArr = [];
    for(var i = 0; i < dropdownArr.length; i++){
        if(dropdownArr[i].options.container !== null){
            if($target.parents('.dropdownSelect-menu').length === 0 && $target.parents('.dropdownSelect').length === 0){
                closeArr.push(dropdownArr[i]);
            }
        }else{
            if($target.closest(".dropdownSelect")[0]!==dropdownArr[i].closest(".dropdownSelect")[0] ) {
                closeArr.push(dropdownArr[i]);
            }
        }
    }
    for(var j = 0; j < closeArr.length; j++){
        if(closeArr[j].data('bs.dropdownSelect')) {
            closeArr[j].dropdownSelect('close');
        }
    }
})

$(window).resize(function(){
    var adjustPosition = function(){
        for(var i = 0; i < dropdownArr.length; i++){
            dropdownArr[i].dropdownSelect('setPosition');
        }
    };

    var throttle = function(fn, ms, context) {
		ms = ms || 150;

		if (ms === -1) {
			return (function() {
				fn.apply(context || this, arguments);
			});
		}

		var start = new Date().getTime();
		return (function() {
			var now = new Date().getTime();
			if (now - start > ms) {
				start = now;
				fn.apply(context || this, arguments);
			}
		});
    };
    
    var fn = throttle(adjustPosition,150);
    setTimeout(function(){
        fn();
    },200)
});

var old = $.fn.dropdownSelect

$.fn.dropdownSelect = Plugin
$.fn.dropdownSelect.Constructor = DropdownSelect


// DropdownSelect NO CONFLICT
// ===================

$.fn.dropdownSelect.noConflict = function () {
    $.fn.dropdownSelect = old
    return this;
}




}(jQuery);

},{}],12:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: dropdown.js v3.3.7
 * http://getbootstrap.com/javascript/#dropdowns
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // DROPDOWN CLASS DEFINITION
  // =========================

  var backdrop = '.dropdown-backdrop'
  var toggle   = '[data-toggle="dropdown"]'
  var Dropdown = function (element) {
    $(element).on('click.bs.dropdown', this.toggle)
  }

  Dropdown.VERSION = '3.3.7'

  function getParent($this) {
    var selector = $this.attr('data-target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    var $parent = selector && $(selector)

    return $parent && $parent.length ? $parent : $this.parent()
  }

  function clearMenus(e) {
    if (e && e.which === 3) return
    $(backdrop).remove()
    $(toggle).each(function () {
      var $this         = $(this)
      var $parent       = getParent($this)
      var relatedTarget = { relatedTarget: this }

      if (!$parent.hasClass('open')) return

      if (e && e.type == 'click' && /input|textarea/i.test(e.target.tagName) && $.contains($parent[0], e.target)) return

      $parent.trigger(e = $.Event('hide.bs.dropdown', relatedTarget))

      if (e.isDefaultPrevented()) return

      $this.attr('aria-expanded', 'false')
      $parent.removeClass('open').trigger($.Event('hidden.bs.dropdown', relatedTarget))
    })
  }

  Dropdown.prototype.toggle = function (e) {
    var $this = $(this)

    if ($this.is('.disabled, :disabled')) return

    var $parent  = getParent($this)
    var isActive = $parent.hasClass('open')

    clearMenus()

    if (!isActive) {
      if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
        // if mobile we use a backdrop because click events don't delegate
        $(document.createElement('div'))
          .addClass('dropdown-backdrop')
          .insertAfter($(this))
          .on('click', clearMenus)
      }

      var relatedTarget = { relatedTarget: this }
      $parent.trigger(e = $.Event('show.bs.dropdown', relatedTarget))

      if (e.isDefaultPrevented()) return

      $this
        .trigger('focus')
        .attr('aria-expanded', 'true')

      $parent
        .toggleClass('open')
        .trigger($.Event('shown.bs.dropdown', relatedTarget))
    }

    return false
  }

  Dropdown.prototype.keydown = function (e) {
    if (!/(38|40|27|32)/.test(e.which) || /input|textarea/i.test(e.target.tagName)) return

    var $this = $(this)

    e.preventDefault()
    e.stopPropagation()

    if ($this.is('.disabled, :disabled')) return

    var $parent  = getParent($this)
    var isActive = $parent.hasClass('open')

    if (!isActive && e.which != 27 || isActive && e.which == 27) {
      if (e.which == 27) $parent.find(toggle).trigger('focus')
      return $this.trigger('click')
    }

    var desc = ' li:not(.disabled):visible a'
    var $items = $parent.find('.dropdown-menu' + desc)

    if (!$items.length) return

    var index = $items.index(e.target)

    if (e.which == 38 && index > 0)                 index--         // up
    if (e.which == 40 && index < $items.length - 1) index++         // down
    if (!~index)                                    index = 0

    $items.eq(index).trigger('focus')
  }


  // DROPDOWN PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.dropdown')

      if (!data) $this.data('bs.dropdown', (data = new Dropdown(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  var old = $.fn.dropdown

  $.fn.dropdown             = Plugin
  $.fn.dropdown.Constructor = Dropdown


  // DROPDOWN NO CONFLICT
  // ====================

  $.fn.dropdown.noConflict = function () {
    $.fn.dropdown = old
    return this
  }


  // APPLY TO STANDARD DROPDOWN ELEMENTS
  // ===================================

  $(document)
    .on('click.bs.dropdown.data-api', clearMenus)
    .on('click.bs.dropdown.data-api', '.dropdown form', function (e) { e.stopPropagation() })
    .on('click.bs.dropdown.data-api', toggle, Dropdown.prototype.toggle)
    .on('keydown.bs.dropdown.data-api', toggle, Dropdown.prototype.keydown)
    .on('keydown.bs.dropdown.data-api', '.dropdown-menu', Dropdown.prototype.keydown)

}(jQuery);

},{}],13:[function(require,module,exports){
/**
 * global 定义组件库全局事件
 */

+function ($) {
	'use strict';

	/*
	*  按钮微动效类
	*/    
	$(document).on("mouseup",".btn:not('[disabled]'),[rippled]:not('[disabled]')",function(){

		var that = this;
		
		$(this).addClass("btn-clicked");

		setTimeout(function(){
			$(that).removeClass("btn-clicked"); 
		},650)

	})

}(jQuery);
},{}],14:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: modal.js v3.3.7
 * http://getbootstrap.com/javascript/#modals
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // MODAL CLASS DEFINITION
  // ======================

  var Modal = function (element, options) {
    this.options             = options
    this.$body               = $(document.body)
    this.$element            = $(element)
    this.$dialog             = this.$element.find('.modal-dialog')
    this.$backdrop           = null
    this.isShown             = null
    this.originalBodyPad     = null
    this.scrollbarWidth      = 0
    this.ignoreBackdropClick = false

    if (this.options.remote) {
      this.$element
        .find('.modal-content')
        .load(this.options.remote, $.proxy(function () {
          this.$element.trigger('loaded.bs.modal')
        }, this))
    }
  }

  Modal.VERSION  = '3.3.7'

  Modal.TRANSITION_DURATION = 300
  Modal.BACKDROP_TRANSITION_DURATION = 150

  Modal.DEFAULTS = {
    backdrop: true,
    keyboard: true,
    show: true
  }

  Modal.prototype.toggle = function (_relatedTarget) {
    return this.isShown ? this.hide() : this.show(_relatedTarget)
  }

  Modal.prototype.show = function (_relatedTarget) {
    var that = this
    var e    = $.Event('show.bs.modal', { relatedTarget: _relatedTarget })

    this.$element.trigger(e)

    if (this.isShown || e.isDefaultPrevented()) return

    this.isShown = true

    this.checkScrollbar()
    this.setScrollbar()
    this.$body.addClass('modal-open')

    this.escape()
    this.resize()

    this.$element.on('click.dismiss.bs.modal', '[data-dismiss="modal"]', $.proxy(this.hide, this))

    this.$dialog.on('mousedown.dismiss.bs.modal', function () {
      that.$element.one('mouseup.dismiss.bs.modal', function (e) {
        if ($(e.target).is(that.$element)) that.ignoreBackdropClick = true
      })
    })

    this.backdrop(function () {
      var transition = $.support.transition && that.$element.hasClass('fade')

      if (!that.$element.parent().length) {
        that.$element.appendTo(that.$body) // don't move modals dom position
      }

      that.$element
        .show()
        .scrollTop(0)

      that.adjustDialog()

      if (transition) {
        that.$element[0].offsetWidth // force reflow
      }

      that.$element.addClass('in')

      that.enforceFocus()

      var e = $.Event('shown.bs.modal', { relatedTarget: _relatedTarget })

      transition ?
        that.$dialog // wait for modal to slide in
          .one('bsTransitionEnd', function () {
            that.$element.trigger('focus').trigger(e)
          })
          .emulateTransitionEnd(Modal.TRANSITION_DURATION) :
        that.$element.trigger('focus').trigger(e)
    })
  }

  Modal.prototype.hide = function (e) {
    if (e) e.preventDefault()

    e = $.Event('hide.bs.modal')

    this.$element.trigger(e)

    if (!this.isShown || e.isDefaultPrevented()) return

    this.isShown = false

    this.escape()
    this.resize()

    $(document).off('focusin.bs.modal')

    this.$element
      .removeClass('in')
      .off('click.dismiss.bs.modal')
      .off('mouseup.dismiss.bs.modal')

    this.$dialog.off('mousedown.dismiss.bs.modal')

    $.support.transition && this.$element.hasClass('fade') ?
      this.$element
        .one('bsTransitionEnd', $.proxy(this.hideModal, this))
        .emulateTransitionEnd(Modal.TRANSITION_DURATION) :
      this.hideModal()
  }

  Modal.prototype.enforceFocus = function () {
    $(document)
      .off('focusin.bs.modal') // guard against infinite focus loop
      .on('focusin.bs.modal', $.proxy(function (e) {
        if (document !== e.target &&
            this.$element[0] !== e.target &&
            !this.$element.has(e.target).length) {
          this.$element.trigger('focus')
        }
      }, this))
  }

  Modal.prototype.escape = function () {
    if (this.isShown && this.options.keyboard) {
      this.$element.on('keydown.dismiss.bs.modal', $.proxy(function (e) {
        e.which == 27 && this.hide()
      }, this))
    } else if (!this.isShown) {
      this.$element.off('keydown.dismiss.bs.modal')
    }
  }

  Modal.prototype.resize = function () {
    if (this.isShown) {
      $(window).on('resize.bs.modal', $.proxy(this.handleUpdate, this))
    } else {
      $(window).off('resize.bs.modal')
    }
  }

  Modal.prototype.hideModal = function () {
    var that = this
    this.$element.hide()
    this.backdrop(function () {
      that.$body.removeClass('modal-open')
      that.resetAdjustments()
      that.resetScrollbar()
      that.$element.trigger('hidden.bs.modal')
    })
  }

  Modal.prototype.removeBackdrop = function () {
    this.$backdrop && this.$backdrop.remove()
    this.$backdrop = null
  }

  Modal.prototype.backdrop = function (callback) {
    var that = this
    var animate = this.$element.hasClass('fade') ? 'fade' : ''

    if (this.isShown && this.options.backdrop) {
      var doAnimate = $.support.transition && animate

      this.$backdrop = $(document.createElement('div'))
        .addClass('modal-backdrop ' + animate)
        .appendTo(this.$body)

      this.$element.on('click.dismiss.bs.modal', $.proxy(function (e) {
        if (this.ignoreBackdropClick) {
          this.ignoreBackdropClick = false
          return
        }
        if (e.target !== e.currentTarget) return
        this.options.backdrop == 'static'
          ? this.$element[0].focus()
          : this.hide()
      }, this))

      if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

      this.$backdrop.addClass('in')

      if (!callback) return

      doAnimate ?
        this.$backdrop
          .one('bsTransitionEnd', callback)
          .emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) :
        callback()

    } else if (!this.isShown && this.$backdrop) {
      this.$backdrop.removeClass('in')

      var callbackRemove = function () {
        that.removeBackdrop()
        callback && callback()
      }
      $.support.transition && this.$element.hasClass('fade') ?
        this.$backdrop
          .one('bsTransitionEnd', callbackRemove)
          .emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) :
        callbackRemove()

    } else if (callback) {
      callback()
    }
  }

  // these following methods are used to handle overflowing modals

  Modal.prototype.handleUpdate = function () {
    this.adjustDialog()
  }

  Modal.prototype.adjustDialog = function () {
    var modalIsOverflowing = this.$element[0].scrollHeight > document.documentElement.clientHeight

    this.$element.css({
      paddingLeft:  !this.bodyIsOverflowing && modalIsOverflowing ? this.scrollbarWidth : '',
      paddingRight: this.bodyIsOverflowing && !modalIsOverflowing ? this.scrollbarWidth : ''
    })
  }

  Modal.prototype.resetAdjustments = function () {
    this.$element.css({
      paddingLeft: '',
      paddingRight: ''
    })
  }

  Modal.prototype.checkScrollbar = function () {
    var fullWindowWidth = window.innerWidth
    if (!fullWindowWidth) { // workaround for missing window.innerWidth in IE8
      var documentElementRect = document.documentElement.getBoundingClientRect()
      fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left)
    }
    this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth
    this.scrollbarWidth = this.measureScrollbar()
  }

  Modal.prototype.setScrollbar = function () {
    var bodyPad = parseInt((this.$body.css('padding-right') || 0), 10)
    this.originalBodyPad = document.body.style.paddingRight || ''
    if (this.bodyIsOverflowing) this.$body.css('padding-right', bodyPad + this.scrollbarWidth)
  }

  Modal.prototype.resetScrollbar = function () {
    this.$body.css('padding-right', this.originalBodyPad)
  }

  Modal.prototype.measureScrollbar = function () { // thx walsh
    var scrollDiv = document.createElement('div')
    scrollDiv.className = 'modal-scrollbar-measure'
    this.$body.append(scrollDiv)
    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
    this.$body[0].removeChild(scrollDiv)
    return scrollbarWidth
  }


  // MODAL PLUGIN DEFINITION
  // =======================

  function Plugin(option, _relatedTarget) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.modal')
      var options = $.extend({}, Modal.DEFAULTS, $this.data(), typeof option == 'object' && option)

      if (!data) $this.data('bs.modal', (data = new Modal(this, options)))
      if (typeof option == 'string') data[option](_relatedTarget)
      else if (options.show) data.show(_relatedTarget)
    })
  }

  var old = $.fn.modal

  $.fn.modal             = Plugin
  $.fn.modal.Constructor = Modal


  // MODAL NO CONFLICT
  // =================

  $.fn.modal.noConflict = function () {
    $.fn.modal = old
    return this
  }


  // MODAL DATA-API
  // ==============

  $(document).on('click.bs.modal.data-api', '[data-toggle="modal"]', function (e) {
    var $this   = $(this)
    var href    = $this.attr('href')
    var $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))) // strip for ie7
    var option  = $target.data('bs.modal') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data())

    if ($this.is('a')) e.preventDefault()

    $target.one('show.bs.modal', function (showEvent) {
      if (showEvent.isDefaultPrevented()) return // only register focus restorer if modal will actually get shown
      $target.one('hidden.bs.modal', function () {
        $this.is(':visible') && $this.trigger('focus')
      })
    })
    Plugin.call($target, option, this)
  })

}(jQuery);

},{}],15:[function(require,module,exports){
/**
 * 实现汉堡包菜单
 * @ author djqiu
 * @ create time 2018.07.18
 * @ version  2.0.0
 */
+function ($) {
    'use strict';
    var NavDrawer = function (element, options) {
        this.$ele = $(element);
        this.options = $.extend({}, NavDrawer.DEFAULTS, options);
        this.options.navIcon = '<i class="' + this.options.navIcon + '"></i>';
        this.options.arrowIcon = '<i class="rightIcon ' + this.options.arrowIcon + '"></i>';
        this.list = [];
        //ie8兼容forEach
        this.initForEach();
        //初始化data
        this.initData(this.options.data);
        //初始化dom
        this.createDoms();
        //初始化事件
        this.bindEvents();
    }

    NavDrawer.VERSION = '1.0.0';

    NavDrawer.DEFAULTS = {
        topArrow: true,
        trigger: 'click',// hover
        navIcon: 'aidicon aidicon-view-sequential',
        navTitle: '全部菜单',
        offset: [0, 0],
        container: '',
        arrowIcon: 'aidicon aidicon-chevron-right',
        height: 400,
        data: []
    }

    NavDrawer.prototype.initForEach = function () {
        if (!Array.prototype.forEach) {
            Array.prototype.forEach = function forEach(callback, thisArg) {
                var T, k;
                if (this == null) {
                    throw new TypeError("this is null or not defined");
                }
                var O = Object(this);
                var len = O.length >>> 0;
                if (typeof callback !== "function") {
                    throw new TypeError(callback + " is not a function");
                }
                if (arguments.length > 1) {
                    T = thisArg;
                }
                k = 0;
                while (k < len) {
                    var kValue;
                    if (k in O) {
                        kValue = O[k];
                        callback.call(T, kValue, k, O);
                    }
                    k++;
                }
            };
        }
    }

    NavDrawer.prototype.initData = function (data) {
        data.forEach(function (element) {
            if (element.children) {
                this.list.push(this.wrapHtml(element));
                this.list.push('<div style=display:none>');
                this.list.push('<ul style=overflow-y:auto;height:' + this.options.height + 'px>');
                this.list.push(element.childrenTitle ? '<span class=children-title>' + element.childrenTitle + '</span>' : '');
                this.initData(element.children);
                this.list.push('</ul></div></li>');
            } else {
                this.list.push(this.wrapHtml(element));
            }
        }, this);
    }

    NavDrawer.prototype.wrapTemplate = function (data) {
        var id = new RegExp("{{id}}", "g"),
            name = new RegExp("{{name}}", "g"),
            nameTips = new RegExp("{{nameTips}}", "g"),
            pre = new RegExp("{{pre}}", "g"),
            preTips = new RegExp("{{pre}}", "g"),
            url = new RegExp("{{url}}", "g"),
            target = new RegExp("{{target}}", "g"),
            icon = new RegExp("{{icon}}", "g");

        data
            .template = data.template.replace(id, data.id)
            .replace(name, data.name)
            .replace(nameTips, data.nameTips)
            .replace(pre, data.pre)
            .replace(preTips, data.preTips)
            .replace(url, data.url)
            .replace(target, data.target)
            .replace(icon, data.icon);
        return data.template;
    }

    NavDrawer.prototype.wrapHtml = function (data) {
        var currentHtml='',
            ArrowIcon = data.children ? this.options.arrowIcon : '';
        data.template = data.template ? this.wrapTemplate(data) : '';
        data.icon = data.icon ? '<i class="leftIcon ' + data.icon + '"></i>' : '';
        data.liName = data.name ? 'name=' + data.name : '';
        data.name = data.name ? '<span>' + data.name + '</span>' : '—';
        data.url = data.url ? 'url=' + data.url : '';
        data.target = data.target ? 'target=' + data.target : '';
        data.id = data.id ? 'id=' + data.id : '';
        data.nameTips = data.nameTips ? 'title=' + data.nameTips : '';
        data.preTips = data.preTips ? 'title=' + data.preTips : '';
        data.pre = data.pre ? '<span class=des ' + data.preTips + '>' + data.pre + '</span>' : '';
        currentHtml = data.template ? data.template : data.icon + data.name + data.pre + ArrowIcon;
        return '<li ' + data.nameTips + " " + data.liName + " " + data.id + " " + data.url + " " + data.target + '>' + currentHtml;
    }

    NavDrawer.prototype.createRandom = function (n) {
        var num = '';
        for (var i = 0; i < n; i++) {
            num += Math.floor(Math.random() * 10);
        }
        return num;
    }

    NavDrawer.prototype.createDoms = function () {
        var model = '<div class="navDrawer">', modelherder = '', modelbody = '', $navBody, $outerNavBody = null,
            temporaryID = '', topArrow = this.options.topArrow ? 'topArrow' : '';
        modelherder += '<div class="navDrawer-header">' + this.options.navIcon + '' + this.options.navTitle + '</div>';
        modelbody += '<div class="navDrawer-body clearfix" style="display:none;">';
        modelbody += this.options.topArrow ? '<div class="arrowTop"></div>' : '';
        modelbody += '<div class="bodyList"><ul style=overflow-y:auto;height:' + this.options.height + 'px>';
        modelbody += this.list.join('');
        modelbody += '</ul></div></div>';
        model += modelherder + modelbody + '</div>';
        this.$ele.html(model);
        if (this.options.container) {
            temporaryID = this.$ele.attr('id') + this.createRandom(5);
            $navBody = this.$ele.find('.navDrawer-body');
            $outerNavBody = $navBody.clone(true);
            this.$ele.data('$outerNavBodyID', temporaryID);
            $navBody.remove();
            $outerNavBody.addClass(this.options.randomClass);
            $outerNavBody.attr('id', temporaryID);
            this.setPosition($outerNavBody);
            $(this.options.container).append($outerNavBody);
        }
    }

    NavDrawer.prototype.setPosition = function ($e) {
        var parentPos = $(this.options.container).offset(),
            triggerPos = this.$ele.offset(),
            pos = {};
        pos.top = this.options.container == 'body' ? (triggerPos.top + this.$ele.outerHeight() + this.options.offset[0] + 0) + "px" : (triggerPos.top - parentPos.top + this.$ele.outerHeight() + this.options.offset[0]) + "px";
        pos.left = (triggerPos.left - parentPos.left + this.options.offset[1]) + "px";
        $e.css(pos);
    }

    NavDrawer.prototype.jumpURL = function (url, target) {
        url && (target == "_blank" ? window.open(url) : window.location.href = url);
    }

    NavDrawer.prototype.bindEvents = function () {
        var $li, $navBody, trigger = this.options.trigger, that = this,
            container = this.options.container;
        if (container) {
            $navBody = $("#" + that.$ele.data('$outerNavBodyID'));
            $li = $($navBody.find("ul")[0]).find("li");
        } else {
            $navBody = $(that.$ele.find('.navDrawer-body'));
            $li = $(this.$ele.find("ul")[0]).find("li");
        }

        if ('click' == trigger) {
            $(document).click(function (e) {
                if (that.$ele.has(e.target).length === 0 && !($navBody.is(e.target)) && $navBody.has(e.target).length === 0) {
                    $navBody.hide()
                }
            })
            this.$ele.on('click', '.navDrawer-header', function () {
                $navBody.is(":visible") ? $navBody.hide() : $navBody.show();
            })

        } else {
            this.$ele.mouseenter(function () {
                $navBody.show()
            })
            this.$ele.mouseleave(function () {
                if (container) {
                    $navBody.mouseenter(function () {
                        $(this).show()
                    })
                    $navBody.mouseleave(function () {
                        $(this).hide()
                    })
                }
                $navBody.hide()
            })
        }
        $navBody.on('click', 'li', function (e) {
            var id = $(this).attr("id"),
                name = $(this).attr('name'),
                url = $(this).attr('url'),
                target = $(this).attr('target'),
                relatedTarget = {relatedTarget: this, id: id, name: name};
            $(e.target).hasClass('children-title') || that.$ele.trigger($.Event('liEvent.bs.navDrawer', relatedTarget));
            that.jumpURL(url, target);
            e.stopPropagation();
        })

        $li.mouseenter(function () {
            $($(this).siblings()).find("div").hide();
            $($(this).find("div")[0]).show();
        })

        $navBody.find('div').mouseleave(function () {
            $(this).find('div').hide();
        })
    }

    // NavDrawer PLUGIN DEFINITION
    // =========================
    function Plugin(option) {
        return this.each(function () {
            var $this = $(this)
            var data = $this.data('bs.NavDrawer')
            var options = typeof option == 'object' && option
            if (!data && /destroy|hide/.test(option)) return
            if (!data) $this.data('bs.NavDrawer', (data = new NavDrawer(this, options)))
            if (typeof option == 'string') data[option]()
        })
    }

    $.fn.NavDrawer = Plugin
    $.fn.NavDrawer.Constructor = NavDrawer

}(jQuery);
},{}],16:[function(require,module,exports){
/**
  左侧菜单较多
  左侧菜单较多
 * @ author wfq
 * @ create time 
 * @ version  2.0.0
 */
+function ($) {
    'use strict';
    navTop.VERSION = '2.0.0';
    navTop.DEFAULTS = {
        trigger: 'click',// hover
        navIcon: "<i class='aidicon aidicon-view-sequential'>",
        navTitle: '全部菜单',
        offset: [0, 0],
        container: '',
        arrowIcon: "<i class='aidicon aidicon-chevron-right'>",
        height: 500,
        data: []
    }

    function navTop(element, options) {
        this.$ele = $(element)
        this.options = $.extend({}, navTop.DEFAULTS, options)
        this.list = [];
        this.hoverHtml = [];
        this.liHtml = [];
        //初始化dom
        this.createDoms();
        //初始化事件
        this.bindEvents();
    }

  


    navTop.prototype.createDoms = function () {
        var model = '<div class="navTop">', modelherder = '', modelbody = '', $navBody, $outerNavBody = null,
            temporaryID = '',hoverHtml = '' ,modelLiHtml = '';
        modelherder += '<div class="navTop-header">' + this.options.navIcon + '' + this.options.navTitle + '</div>';
        modelbody += '<div class="navTop-body clearfix" style="display:none;">';
        for(var i = 0 ; i <this.options.data.length; i++ ){
          hoverHtml = '',modelLiHtml = '';
          modelbody += '<div><p>'+this.options.data[i].nodeName+'</p> <ul style=height:' + this.options.height + 'px>';

          if(this.options.data[i].children.length < 6){
            for(var j = 0 ; j< this.options.data[i].children.length; j++){
              modelbody += '<li title="'+this.options.data[i].children[j].name +'">';
              modelbody += this.options.data[i].children[j].icon ? this.options.data[i].children[j].icon : '';
              modelbody += this.options.data[i].children[j].name +'</li>';
              
            }

          }else{
            for(var j = 0 ; j< this.options.data[i].children.length; j++){
              hoverHtml += '<li title="'+this.options.data[i].children[j].name +'">'
              hoverHtml += this.options.data[i].children[j].icon ? this.options.data[i].children[j].icon : '';
              hoverHtml += this.options.data[i].children[j].name +'</li>';
              if(j < 4){
                modelLiHtml += '<li title="'+this.options.data[i].children[j].name +'">';
                modelLiHtml += this.options.data[i].children[j].icon ? this.options.data[i].children[j].icon : '';
                modelLiHtml += this.options.data[i].children[j].name +'</li>';
              }
            }
            modelLiHtml += '<li data-num="'+i+'"  class="more"><a>更多+</a></li>';
          } 
          this.hoverHtml[i] = hoverHtml;
          this.liHtml[i] = modelLiHtml;
          modelbody += modelLiHtml ;
          
          modelbody += '</ul></div>';
        }
        //modelbody += this.list.join('');
        model += modelherder + modelbody + '</div>';
        this.$ele.html(model);
       
    }
    navTop.prototype.bindEvents = function () {

        var $li,$liMore, $navBody, trigger = this.options.trigger, that = this, initHoverHtml = ''; 
        $navBody = $(that.$ele.find('.navTop-body'));
        $li = $(this.$ele.find("ul")[0]).find("li");
        $liMore = $(this.$ele.find("ul")[0]).find("li.more");

        if ('click' == trigger) {
            this.$ele.on(this.options.trigger, '.navTop-header', function () {
                $navBody.is(":visible") ? $navBody.hide() : $navBody.show();
            })
        } else {
            this.$ele.mouseenter(function () {
                $navBody.show();
               
            })
            
            this.$ele.mouseleave(function () {
                for(var i = 0 ; i< that.liHtml.length;i++){
                  if(that.liHtml[i]){
                    $(this).find('ul:eq('+i+')').html(that.liHtml[i])
                  }
                }
                $navBody.mouseenter(function () {
                    $(this).show();
                })
                $navBody.mouseleave(function () {
                    $(this).hide()  
                })
                $navBody.hide()
                
            })
           
        }

        $navBody.on('click', 'li', function (e) {
            var relatedTarget = {relatedTarget: this, id: $(this).attr("id"), name: $(this).attr('name')};
            that.$ele.trigger($.Event('click.bs.navTop', relatedTarget));
            e.stopPropagation();
        })
        $navBody.on('mouseover', 'li.more', function (e) {
          $(this).parent().html(that.hoverHtml[$(this).attr('data-num')]);
        
        })
        $li.mouseenter(function () {
            $($(this).siblings()).find("div").hide();
            $($(this).find("div")[0]).show();

        })

        $navBody.find('div').mouseleave(function () {
            $(this).find('div').hide();
        })
    }

    // navTop PLUGIN DEFINITION
    // =========================
    function Plugin(option) {
        return this.each(function () {
            var $this = $(this)
            var data = $this.data('bs.navTop')
            var options = typeof option == 'object' && option

            if (!data && /destroy|hide/.test(option)) return
            if (!data) $this.data('bs.navTop', (data = new navTop(this, options)))
            if (typeof option == 'string') data[option]()
        })
    }
    $.fn.navTop = Plugin
    $.fn.navTop.Constructor = navTop

}(jQuery);
},{}],17:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: popover.js v3.3.7
 * http://getbootstrap.com/javascript/#popovers
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // POPOVER PUBLIC CLASS DEFINITION
  // ===============================

  var Popover = function (element, options) {
    this.init('popover', element, options)
  }

  if (!$.fn.tooltip) throw new Error('Popover requires tooltip.js')

  Popover.VERSION  = '3.3.7'

  Popover.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {
    placement: 'right',
    trigger: 'click',
    content: '',
    template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
  })


  // NOTE: POPOVER EXTENDS tooltip.js
  // ================================

  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype)

  Popover.prototype.constructor = Popover

  Popover.prototype.getDefaults = function () {
    return Popover.DEFAULTS
  }

  Popover.prototype.setContent = function () {
    var $tip    = this.tip()
    var title   = this.getTitle()
    var content = this.getContent()

    $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title)
    $tip.find('.popover-content').children().detach().end()[ // we use append for html objects to maintain js events
      this.options.html ? (typeof content == 'string' ? 'html' : 'append') : 'text'
    ](content)

    $tip.removeClass('fade top bottom left right in')

    // IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
    // this manually by checking the contents.
    if (!$tip.find('.popover-title').html()) $tip.find('.popover-title').hide()
  }

  Popover.prototype.hasContent = function () {
    return this.getTitle() || this.getContent()
  }

  Popover.prototype.getContent = function () {
    var $e = this.$element
    var o  = this.options

    return $e.attr('data-content')
      || (typeof o.content == 'function' ?
            o.content.call($e[0]) :
            o.content)
  }

  Popover.prototype.arrow = function () {
    return (this.$arrow = this.$arrow || this.tip().find('.arrow'))
  }


  // POPOVER PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.popover')
      var options = typeof option == 'object' && option

      if (!data && /destroy|hide/.test(option)) return
      if (!data) $this.data('bs.popover', (data = new Popover(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.popover

  $.fn.popover             = Plugin
  $.fn.popover.Constructor = Popover


  // POPOVER NO CONFLICT
  // ===================

  $.fn.popover.noConflict = function () {
    $.fn.popover = old
    return this
  }

}(jQuery);

},{}],18:[function(require,module,exports){
/**
 * 实现多种定位方式
 * @ author rbai
 * @ create time 2014.08.11
 * @ version  1.0.0
 */
;
(function(){
    var Position = {},
        VIEWPORT = {
            _id: 'VIEWPORT',
            nodeType: 1
        },
        isPinFiexd = false, //用来标示目标元素是否为fiex定位
        ua = (window.navigator.userAgent || "").toLowerCase(),
        isIE6 = ua.indexOf("msie 6") !== -1,
        alignFunc = function(pinLength, baseLength, alignType) {

            return alignType === 0 ? (baseLength - pinLength)/2 : alignType === -1 ? baseLength - pinLength : 0;

        },
        directionType = {
            '^' : function(pinElement, baseElement, alignType) {

                var pinLength = pinElement.outerWidth(),
                    baseLength = baseElement.outerWidth();

                return {

                    x: alignFunc(pinLength, baseLength, alignType),
                    y: -pinElement.outerHeight()

                }

            },
            'v' : function(pinElement, baseElement, alignType) {

                var pinLength = pinElement.outerWidth(),
                    baseLength = baseElement.outerWidth();

                return {

                    x: alignFunc(pinLength, baseLength, alignType),
                    y: baseElement.outerHeight()

                }

            },
            '>' : function(pinElement, baseElement, alignType) {

                var pinLength = pinElement.outerHeight(),
                    baseLength = baseElement.outerHeight();

                return {

                    x: baseElement.outerWidth(),
                    y: alignFunc(pinLength, baseLength, alignType)

                }

            },
            '<' : function(pinElement, baseElement, alignType) {

                var pinLength = pinElement.outerHeight(),
                    baseLength = baseElement.outerHeight();

                return {

                    x: -pinElement.outerWidth(),
                    y: alignFunc(pinLength, baseLength, alignType)

                }

            }
        }

    Position.isOutLeft = function(left, pinElement, parentNode) {

        var offsetLeft = parentNode ? parentNode.offset().left : 0,
            scrollLeft = parentNode ? parentNode.scrollLeft() : 0,
            width = parentNode ? parentNode.outerWidth() : $(window).width();

        return left < offsetLeft;

    }

    Position.isOutRight = function(left, pinElement, parentNode) {

        var offsetLeft = parentNode ? parentNode.offset().left : 0,
            scrollLeft = parentNode ? parentNode.scrollLeft() : 0,
            width = parentNode ? parentNode.outerWidth() : $(window).width();

        return ((left - offsetLeft - scrollLeft + pinElement.outerWidth()) > width);

    }

    Position.isOutTop = function(top, pinElement, parentNode) {

        var offsetTop = parentNode ? parentNode.offset().top : 0,
            scrollTop = parentNode ? parentNode.scrollTop() : 0,
            height = parentNode ? parentNode.outerHeight() : $(window).height();

        return top < offsetTop;

    }

    Position.isOutBottom = function(top, pinElement, parentNode) {

        var offsetTop = parentNode ? parentNode.offset().top : 0,
            scrollTop = parentNode ? parentNode.scrollTop() : 0,
            height = parentNode ? parentNode.outerHeight() : $(window).height();


        return ((top - offsetTop - scrollTop + pinElement.outerHeight()) > height);

    }

    /**
     * 将目标元素相对于基准元素进行定位。
     * @param {Obj} 目标元素
     * @param {obj} 基准元素
     */
    Position.pin = function(pinObject, baseObject, parentNode, direction, alignType, centerDist, isSuitable) {

        var d = {
            '>': 'Right',
            '<': 'Left',
            '^': 'Top',
            'v': 'Bottom'
        }

        var opp = {
            '>': '<',
            '<': '>',
            'v': '^',
            '^': 'v'
        }

        var other = {
            '>': ['Top', 'Bottom'],
            '<': ['Top', 'Bottom'],
            '^': ['Left', 'Right'],
            'v': ['Left', 'Right']
        }
        
        var offset = Position.getPinOffset(pinObject, baseObject, parentNode, direction, alignType, centerDist);
        var pinElement = $(pinObject.element);
        var len = (direction === '<' || direction === '>') ? offset.left : offset.top;
        var inD1 = Position['isOut'+d[direction]](len, pinElement, parentNode);
        var inD2 = Position['isOut'+d[opp[direction]]](len, pinElement, parentNode);

        if(direction&&alignType!==undefined&&isSuitable) {

            if(inD1&&!inD2) {

                direction = opp[direction];
                offset = Position.getPinOffset(pinObject, baseObject, parentNode, direction, alignType, centerDist);

            }

            var len1 = (direction === '<' || direction === '>') ? offset.top : offset.left;
            var len2 = (direction === '<' || direction === '>') ? offset.top : offset.left;

            var inD3 = Position['isOut'+other[direction][0]](len1, pinElement, parentNode);
            var inD4 = Position['isOut'+other[direction][1]](len2, pinElement, parentNode);

            alignType = inD3 ? (inD4 ? alignType : 1) : (inD4 ? -1 : alignType);

            offset = Position.getPinOffset(pinObject, baseObject, parentNode, direction, alignType, centerDist);

        }

        // 定位目标元素
        pinElement.css({
            left: offset.left,
            top: offset.top
        });

        return {
            direction: d[direction],
            alignType: alignType
        }

    }

    Position.getPinOffset = function(pinObject, baseObject, parentNode, direction, alignType, centerDist) {

        var centerDistLeft = 0,centerDistTop = 0;

        if(direction&&centerDist) {

            centerDistLeft = (direction === '>' ? 1 : -1) * centerDist;
            centerDistTop = (direction === 'v' ? 1 : -1) * centerDist;

        }

        //将两个参数转化为标准定位对象 {element: a, x: 0, y: 0}
        pinObject = normalize(pinObject);
        baseObject = normalize(baseObject);


        // 设定目标元素的 position 为绝对定位
        // 若元素的初始 position 不为 absolute，会影响元素的 display、宽高等属性
        var pinElement = $(pinObject.element);
        var baseElement = $(baseObject.element);
        var directionObj;

        if (pinElement.css('position') !== 'fixed' || isIE6) {
            pinElement.css('position', 'absolute');
            isPinFixed = false;
        } else {
            // 定位 fixed 元素的标志位，下面有特殊处理
            isPinFixed = true;
        }

        // 将位置属性归一化为数值
        // 注：必须放在上面这句 `css('position', 'absolute')` 之后，
        //    否则获取的宽高有可能不对
        posConverter(pinObject);
        posConverter(baseObject);

        var parentOffset = getParentOffset(pinElement);
        var baseOffset = baseObject.offset();

        // 先判断方向

        if(direction&&alignType!==undefined) {

            directionObj = directionType[direction](pinElement, baseElement, alignType);

        }

        // 计算目标元素的位置
        var top = baseOffset.top + baseObject.y -
            pinObject.y - parentOffset.top + (directionObj?directionObj.y:0);

        var left = baseOffset.left + baseObject.x -
            pinObject.x - parentOffset.left + (directionObj?directionObj.x:0);

        if(parentNode){
            top += parentNode.scrollTop();
            left += parentNode.scrollLeft();
        }

        return {
            left: left + centerDistLeft,
            top: top + centerDistTop
        }

        // 定位目标元素
        // pinElement.css({
        //     left: left,
        //     top: top
        // });
    }

    // 将目标元素相对于基准元素进行居中定位
    // 接受两个参数，分别为目标元素和定位的基准元素，都是 DOM 节点类型
    Position.center = function(pinElement, baseElement) {
        Position.pin({
            element: pinElement,
            x: '50%',
            y: '50%'
        }, {
            element: baseElement,
            x: '50%',
            y: '50%'
        });
    };

    /* 相对于基准元素四周定位
     * @param {Object} pinElement 目标元素
     * @param {Object} baseElement 基类元素
     * @param {Object} options 定位配置箱
     * options : {
            direction: 'h', // v
            offset: [0, 0]

       }
     */
    Position.advPin = function(pinElement, baseElement, options) {

        pinElement = $(pinElement), baseElement = $(baseElement);
        // 准备坐标数据
        var baseWidth = baseElement.outerWidth(),
            baseHeight = baseElement.outerHeight(),
            baseLeft = baseElement.offset().left,
            baseTop = baseElement.offset().top,
            pinWidth = pinElement.outerWidth(),
            pinHeight = pinElement.outerHeight(),
            pinLeft = pinElement.offset().left,
            pinTop = pinElement.offset().top,
            scrollTop = $(document).scrollTop(),
            scrollLeft = $(document).scrollLeft(),
            winHeight = $(window).height(),
            winWidth = $(window).width(),
            offset;
        if (arguments.length === 2) {

            options = {
                direction: 'v'
            }
        } else if (arguments.length === 3 && typeof options == 'string') {
            options = {
                direction: options
            }
        }

        if (pinElement.css('position') !== 'fixed') {
            pinElement.css('position', 'absolute');
        }

        //计算偏移量
        if (options.offset) {
            offset = options.offset;
        }
        if (options.direction == 'v') { // 垂直定位
            var tempHeight = winHeight - (baseTop - scrollTop + baseHeight + pinHeight),
                tempTop, tempLeft;
            offset ? (tempTop = baseTop + offset[0], tempLeft = baseLeft + offset[1]) : (tempTop = baseTop, tempLeft = baseLeft);
            if (tempHeight > 0) {
                // 定位到基类元素底部
                pinElement.css({
                    top: (tempTop + baseHeight),
                    left: tempLeft
                });
            } else {
                // 定位到基类元素上面
                if ((baseTop - scrollTop) < pinHeight) {
                    pinElement.css({
                        top: (tempTop + baseHeight),
                        left: tempLeft
                    });
                } else {
                    pinElement.css({
                        top: (tempTop - pinHeight),
                        left: tempLeft
                    });
                }

            }
        } else if (options.direction == 'h') { // 水平定位
            var tempWidth = winWidth - (baseLeft - scrollLeft + baseWidth + pinWidth);
            offset ? (tempTop = baseTop + offset[0], tempLeft = baseLeft + offset[1]) : (tempTop = baseTop, tempLeft = baseLeft);
            if (tempWidth > 0) {
                // 定位到基类元素右边
                pinElement.css({
                    left: (tempLeft + baseWidth),
                    top: tempTop
                });
            } else {
                // 定位到基类元素上面
                if ((baseLeft - scrollLeft) < pinWidth) {
                    pinElement.css({
                        left: (tempLeft + baseWidth),
                        top: tempTop
                    });
                } else {
                    pinElement.css({
                        left: (tempLeft - pinWidth),
                        top: tempTop
                    });
                }

            }
        }



    }

    /*
     * 获取一个元素的位置
     * @param {String} pinElement 需要获取的元素
     * @param {String} type 获取位置方式，支持"fixed",即获取元素相对于window的位置，默认是相对于document的位置
     * return {top:0,right:0,bottom:0,left:0}
     */
    Position.location = function(pinElement, type) {
        pinElement = $(pinElement);
        var pinWidth = pinElement.outerWidth(),
            pinHeight = pinElement.outerHeight(),
            pinLeft = pinElement.offset().left,
            pinTop = pinElement.offset().top,
            scrollTop = $(document).scrollTop(),
            scrollLeft = $(document).scrollLeft(),
            winHeight = $(window).height(),
            winWidth = $(window).width(),
            docHeight = $(document).height(),
            docWidth = $(document).width();

        if (type == 'fixed') {
            return {
                top: (pinTop - scrollTop),
                right: (winWidth - (pinLeft - scrollLeft) - pinWidth),
                bottom: (winHeight - (pinTop - scrollTop) - pinHeight),
                left: (pinLeft - scrollLeft)
            };
        } else {
            return {
                top: pinTop,
                right: (docWidth - pinLeft - pinWidth),
                bottom: (docHeight - pinTop - pinHeight),
                left: pinLeft
            };
        }
    }

    /**
     * 计算两个元素重合的面积
     */
    Position.overlapArea = function(rElement, bElement){

        var rOffset = rElement.offset(),
            rleft = rOffset.left,
            rtop = rOffset.top,
            rwidth = rElement.width(),
            rHeight = rElement.height(),
            bOffset = bElement.offset(),
            bleft = bOffset.left,
            btop = bOffset.top,
            bwidth = bElement.width(),
            bheight = bElement.height();

        if((rleft + rwidth < bleft) || (bleft+bwidth < rleft) || (rtop + rHeight < btop) || (btop+bheight < rtop)){
            return 0;
        }

        // 计算重叠的left，top
        var tempLeft = rleft - bleft,
            overlapLeft,
            tempTop = rtop - btop,
            overlapTop;

        overlapLeft = tempLeft < 0 ? rwidth - Math.abs(tempLeft) : bwidth - tempLeft;

        overlapTop = tempTop < 0 ? rHeight - Math.abs(tempTop) : bheight - tempTop;

        return [overlapLeft, overlapTop];

    };


    // 这是当前可视区域的伪 DOM 节点
    // 需要相对于当前可视区域定位时，可传入此对象作为 element 参数
    Position.VIEWPORT = VIEWPORT;


    // global.oasis.Position = global.Position = Position;


    // Helpers
    // -------

    // 将参数包装成标准的定位对象，形似 { element: a, x: 0, y: 0 }

    function normalize(posObject) {
        posObject = toElement(posObject) || {};

        if (posObject.nodeType) {
            posObject = {
                element: posObject
            };
        }

        var element = toElement(posObject.element) || VIEWPORT;
        if (element.nodeType !== 1) {
            throw new Error('posObject.element is invalid.');
        }

        var result = {
            element: element,
            x: posObject.x || 0,
            y: posObject.y || 0
        };

        // config 的深度克隆会替换掉 Position.VIEWPORT, 导致直接比较为 false
        var isVIEWPORT = (element === VIEWPORT || element._id === 'VIEWPORT');

        // 归一化 offset
        result.offset = function() {
            // 若定位 fixed 元素，则父元素的 offset 没有意义
            if (isPinFixed) {
                return {
                    left: 0,
                    top: 0
                };
            } else if (isVIEWPORT) {
                return {
                    left: $(document).scrollLeft(),
                    top: $(document).scrollTop()
                };
            } else {
                return getOffset($(element)[0]);
            }
        };

        // 归一化 size, 含 padding 和 border
        result.size = function() {
            var el = isVIEWPORT ? $(window) : $(element);
            return {
                width: el.outerWidth(),
                height: el.outerHeight()
            };
        };

        return result;
    }

    // 对 x, y 两个参数为 left|center|right|%|px 时的处理，全部处理为纯数字

    function posConverter(pinObject) {
        pinObject.x = xyConverter(pinObject.x, pinObject, 'width');
        pinObject.y = xyConverter(pinObject.y, pinObject, 'height');
    }

    // 处理 x, y 值，都转化为数字

    function xyConverter(x, pinObject, type) {
        // 先转成字符串再说！好处理
        x = x + '';

        // 处理 px
        x = x.replace(/px/gi, '');

        // 处理 alias
        if (/\D/.test(x)) {
            x = x.replace(/(?:top|left)/gi, '0%')
                .replace(/center/gi, '50%')
                .replace(/(?:bottom|right)/gi, '100%');
        }

        // 将百分比转为像素值
        if (x.indexOf('%') !== -1) {
            //支持小数
            x = x.replace(/(\d+(?:\.\d+)?)%/gi, function(m, d) {
                return pinObject.size()[type] * (d / 100.0);
            });
        }

        // 处理类似 100%+20px 的情况
        if (/[+\-*\/]/.test(x)) {
            try {
                // eval 会影响压缩
                // new Function 方法效率高于 for 循环拆字符串的方法
                // 参照：http://jsperf.com/eval-newfunction-for
                x = (new Function('return ' + x))();
            } catch (e) {
                throw new Error('Invalid position value: ' + x);
            }
        }

        // 转回为数字
        return numberize(x);
    }

    // 获取 offsetParent 的位置

    function getParentOffset(element) {
        var parent = element.offsetParent();

        // IE7 下，body 子节点的 offsetParent 为 html 元素，其 offset 为
        // { top: 2, left: 2 }，会导致定位差 2 像素，所以这里将 parent
        // 转为 document.body
        if (parent[0] === document.documentElement) {
            parent = $(document.body);
        }

        // 修正 ie6 下 absolute 定位不准的 bug
        if (isIE6) {
            parent.css('zoom', 1);
        }

        // 获取 offsetParent 的 offset
        var offset;

        // 当 offsetParent 为 body，
        // 而且 body 的 position 是 static 时
        // 元素并不按照 body 来定位，而是按 document 定位
        // http://jsfiddle.net/afc163/hN9Tc/2/
        // 因此这里的偏移值直接设为 0 0
        if (parent[0] === document.body &&
            parent.css('position') === 'static') {
            offset = {
                top: 0,
                left: 0
            };
        } else {
            offset = getOffset(parent[0]);
        }

        // 根据基准元素 offsetParent 的 border 宽度，来修正 offsetParent 的基准位置
        offset.top += numberize(parent.css('border-top-width'));
        offset.left += numberize(parent.css('border-left-width'));

        return offset;
    }

    function numberize(s) {
        return parseFloat(s, 10) || 0;
    }

    function toElement(element) {
        return $(element)[0];
    }

    // fix jQuery 1.7.2 offset
    // document.body 的 position 是 absolute 或 relative 时
    // jQuery.offset 方法无法正确获取 body 的偏移值
    //   -> http://jsfiddle.net/afc163/gMAcp/
    // jQuery 1.9.1 已经修正了这个问题
    //   -> http://jsfiddle.net/afc163/gMAcp/1/
    // 这里先实现一份
    // 参照 kissy 和 jquery 1.9.1
    //   -> https://github.com/kissyteam/kissy/blob/master/src/dom/sub-modules/base/src/base/offset.js#L366 
    //   -> https://github.com/jquery/jquery/blob/1.9.1/src/offset.js#L28

    function getOffset(element) {
        var box = element.getBoundingClientRect(),
            docElem = document.documentElement;

        // < ie8 不支持 win.pageXOffset, 则使用 docElem.scrollLeft
        return {
            left: box.left + (window.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || document.body.clientLeft || 0),
            top: box.top + (window.pageYOffset || docElem.scrollTop) - (docElem.clientTop || document.body.clientTop || 0)
        };
    }
    window.Position =  Position;
})();
},{}],19:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: rate.js
 * 评分组件
 * @ author fqwang
 * @ create time 2018.07.11
 * @ version  2.0.0
 * */


+function ($) {
    'use strict';

    // rate PUBLIC CLASS DEFINITION
    // ================================

    var Rate = function (element, options) {
        this.$element      = $(element)
        this.options       = $.extend({}, Rate.DEFAULTS, options)
        this.curGrade = this.options.grade;
        this.times = 0;   // 可点击的次数 
        
         this.init();
         //初始化事件
        this.bindEvents();
    }

    Rate.VERSION  = '3.3.7'

    Rate.TRANSITION_DURATION = 350

    Rate.DEFAULTS = {
        type: 'star',
        disable: false, // 禁用 如果禁用,没有交互,仅展示
                        // 星星评分的参数 如下
        allowHalf: false, // 是否半选
        grade: 0, // 分数,默认是0
        count: 5, // 总数
        allowClear: true , // 是否允许再次点击时清除 
                            // 点赞方式的参数如下
        sustain: "repeal", // 点赞的方式 1 可撤销的点赞  repeal   2 一直可点 perpetual
        susNum:   '0', // 当前的点赞数
        susNumState: true ,     //当前的点赞数状态  显示和不显示   默认显示
        susDirection: 'up', //方向   up   down
        perpetualTimes: 5,   // 可点击的次数

    }
    Rate.prototype.init = function () {   
        this.show(); // 初始化,创建dom结构并显示
    }
    Rate.prototype.show = function () {
        var that = this , html = '';
        if(that.options.type == 'star'){ //评分
            html = that.creatStarHtml();
        }else if(that.options.type=='ticket') { //点赞
            html = that.creatTicketrHtml();
        }
        that.$element.empty().append(html);
    }
    // 点赞 dom 创建
    Rate.prototype.creatTicketrHtml = function(){
        var that = this ,$html = '';
        $html = document.createElement('p');
        $html.className = 'aidicon';
        $html.setAttribute('data-toggle', 'rate');
        var $i = document.createElement('i');
        $i.className = 'aidicon aidicon-thumb-'+((that.options.susDirection == 'up') ? 'up' : 'down')+'-outline' + (that.options.disable? ' disable' : '') ;
        $html.appendChild($i);
        if(that.options.susNumState){
          var $span = document.createElement('span');
          $span.innerHTML = that.options.susNum;
          $html.appendChild($span);
        }
        return $html;
    }

    // 评分 DOM 创建
    Rate.prototype.creatStarHtml = function(){
        var that = this , $html = '';
        var countStar = parseInt(that.options.count , 10);
        $html = document.createElement('p');
        $html.className = 'rate';
        if(that.options.allowHalf){ // 半选
            that.options.grade *=2;
            that.curGrade　=  (that.options.grade >0) ?that.options.grade : 0 ;
            for(var i = 0; i< countStar*2; i++ ){
                var $span = document.createElement('span');
                var half = (i%2 == 0) ? 'rate-half-left' : 'rate-half-right';
                var click = (i < that.options.grade && that.options.grade != 0)? ' click ' : '';
                var cun =  ( that.options.disable)? ' rate-cun ' : '';
                var disable = ((i < that.options.grade) &&that.options.disable) ? ' disable' : '';
                $span.className = 'rate-icon '+ half + click + cun + disable;
                $span.setAttribute('data-toggle', 'rate');
                $html.appendChild($span);
            }
        }else { // 全选
            that.curGrade　= (that.options.grade > 0 )? that.options.grade : 0 ;
            for(var i = 0; i < countStar; i++ ){
                var $span = document.createElement('span');
                $span.setAttribute('data-toggle', 'rate');
                var click = ((i < that.options.grade)? 'click': '');
                var cun = (((i < that.options.grade)&&that.options.disable)? ' rate-cun': ' ')
                var disable = (that.options.disable)? 'disable rate-cun': ' '
                $span.className = 'star-all '+((i < that.options.grade)? 'click ': ' ') + cun + disable;
                $html.appendChild($span);
            } 
        }
        return $html;
    }
    Rate.prototype.setDisable = function (flag){
        this.options.disable = flag;
        this.show();
    }
    Rate.prototype.setGrade = function (grade){
        if(this.options.type == 'star'){
            this.options.grade = grade;
        }else if(this.options.type == 'ticket'){
            this.options.susNum = grade;
            this.times = 0;
        }
        this.show();
    }
    Rate.prototype.getGrade = function (){
        if(this.options.type == 'star'){
            return this.curGrade ;
        }else if(this.options.type == 'ticket'){
            return this.options.susNum;
        }
        
    }
    Rate.prototype.amination = function anp(e , num) {
        var $i = $("<b>").text(num + '1');
        $i.css({
            top: '-20px',
            left: '5px',
            position: "absolute",
            color: "#2D2F33"
        });
        e.append($i);
        $i.animate({
            top: '-30px',
            left: '5px',
            fontSize: '12px',
            opacity: 0
        }, 400, function() {
            $i.remove();
        });  
    }
    // 评分选择
    Rate.prototype.goto = function (ele) {
        var that = this;
        if (that.curGrade < 0  || that.options.disable || that.times == that.options.perpetualTimes) {
            return;
        }
        if(that.options.type == 'star'){
            if((parseInt($(ele).index()+1 , 10)) == that.curGrade && that.options.allowClear ){
                $(ele).removeClass('click').siblings().removeClass('click');
                that.curGrade = 0;
                that.options.grade = 0;
            }else{
                $(ele).addClass('click').prevAll().addClass('click');
                $(ele).nextAll().removeClass('click');
                that.curGrade = $(ele).index()+1;
                that.options.grade =  $(ele).index()+1;
            }
            var relatedTarget = {relatedTarget: this, grade: that.curGrade};
            var e = $.Event('change.bs.rate' , relatedTarget);
            $(ele).trigger(e); 
        }else if(that.options.type == 'ticket'){
            if(that.options.sustain == 'repeal'){ // 可撤销的点赞
              var icon = (that.options.susDirection == 'up') ? 'up' : 'down';

                if($(ele).find('i').hasClass('fav')){
                  $(ele).find('span').html(--that.options.susNum);
                  that.amination($(ele) , '-'); //动画

                }else{ // 点赞
                  $(ele).find('span').html(++that.options.susNum);
                  that.amination($(ele) , '+'); 
                }
                $(ele).find('i').toggleClass('fav aidicon-thumb-'+ icon+'-outline aidicon-thumb-'+icon);
            }else{ // 一直可以点赞
                that.times++;
                $(ele).find('i').removeClass('aidicon-thumb-'+ icon+'-outline').addClass('aidicon-thumb-'+icon).addClass('fav');
                $(ele).find('span').html(++that.options.susNum);
                that.amination($(ele) , '+');

            }
            var relatedTarget = {relatedTarget: this, grade: that.options.susNum};
            var e = $.Event('change.bs.rate' , relatedTarget);
            $(ele).trigger(e); 
        }	
       
    }
    Rate.prototype.hover = function (ele , eventType) {
        var that = this;
        if(that.options.type == 'ticket' || that.options.disable){
            return
        }
        if((parseInt($(ele).index()+1 , 10) == 1) &&　eventType == 'mouseleave' && that.curGrade == 0　){
            $(ele).removeClass('click');
            $(ele).siblings().eq(that.curGrade).nextAll().removeClass('click');
        }else if((parseInt($(ele).index()+1 , 10) > that.curGrade ) && eventType == 'mouseleave'){
            $(ele).removeClass('click');
            $(ele).siblings().eq(that.curGrade).removeClass('click');
            $(ele).siblings().eq(that.curGrade).nextAll().removeClass('click');	
        }else if((that.curGrade) <= parseInt($(ele).index()+1 , 10)){
            $(ele).addClass('click');
            $(ele).prevAll().addClass('click');
            $(ele).nextAll().removeClass('click');	
        } 

    }
    Rate.prototype.bindEvents = function () {
        var that =  this;
        this.$element.on('click', '[data-toggle="rate"]', function () {
            that.goto(this);  
        });
        this.$element.on('mouseenter', '[data-toggle="rate"]', function () {
            that.hover(this);  
        })
        this.$element.on('mouseleave', '[data-toggle="rate"]', function () {
             that.hover(this , 'mouseleave');   
        })
    }
    // rate PLUGIN DEFINITION
    // ==========================

    function Plugin(option , obj) {
        if( /^get/.test(option) && obj === undefined){
            var $this = $(this)
            var data = $this.data('bs.rate');
            return data[option](obj)
        }
        return this.each(function () {
            var $this   = $(this)
            var data    = $this.data('bs.rate')
            var options = typeof option == 'object' && option
            if (!data && /destroy|hide/.test(option)) return
            if (!data) $this.data('bs.rate', (data = new Rate(this, options)))
            if (typeof option == 'string') data[option](obj)
            
        })
    }
    
    var old = $.fn.rate
    
    $.fn.rate             = Plugin
    $.fn.rate.Constructor = Rate
    // rate NO CONFLICT
    // ====================
    
    $.fn.rate.noConflict = function () {
        $.fn.rate = old
        return this
    }
}(jQuery);
},{}],20:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: scrollspy.js v3.3.7
 * http://getbootstrap.com/javascript/#scrollspy
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // SCROLLSPY CLASS DEFINITION
  // ==========================

  function ScrollSpy(element, options) {
    this.$body          = $(document.body)
    this.$scrollElement = $(element).is(document.body) ? $(window) : $(element)
    this.options        = $.extend({}, ScrollSpy.DEFAULTS, options)
    this.selector       = (this.options.target || '') + ' .nav li > a'
    this.offsets        = []
    this.targets        = []
    this.activeTarget   = null
    this.scrollHeight   = 0

    this.$scrollElement.on('scroll.bs.scrollspy', $.proxy(this.process, this))
    this.refresh()
    this.process()
  }

  ScrollSpy.VERSION  = '3.3.7'

  ScrollSpy.DEFAULTS = {
    offset: 10
  }

  ScrollSpy.prototype.getScrollHeight = function () {
    return this.$scrollElement[0].scrollHeight || Math.max(this.$body[0].scrollHeight, document.documentElement.scrollHeight)
  }

  ScrollSpy.prototype.refresh = function () {
    var that          = this
    var offsetMethod  = 'offset'
    var offsetBase    = 0

    this.offsets      = []
    this.targets      = []
    this.scrollHeight = this.getScrollHeight()

    if (!$.isWindow(this.$scrollElement[0])) {
      offsetMethod = 'position'
      offsetBase   = this.$scrollElement.scrollTop()
    }

    this.$body
      .find(this.selector)
      .map(function () {
        var $el   = $(this)
        var href  = $el.data('target') || $el.attr('href')
        var $href = /^#./.test(href) && $(href)

        return ($href
          && $href.length
          && $href.is(':visible')
          && [[$href[offsetMethod]().top + offsetBase, href]]) || null
      })
      .sort(function (a, b) { return a[0] - b[0] })
      .each(function () {
        that.offsets.push(this[0])
        that.targets.push(this[1])
      })
  }

  ScrollSpy.prototype.process = function () {
    var scrollTop    = this.$scrollElement.scrollTop() + this.options.offset
    var scrollHeight = this.getScrollHeight()
    var maxScroll    = this.options.offset + scrollHeight - this.$scrollElement.height()
    var offsets      = this.offsets
    var targets      = this.targets
    var activeTarget = this.activeTarget
    var i

    if (this.scrollHeight != scrollHeight) {
      this.refresh()
    }

    if (scrollTop >= maxScroll) {
      return activeTarget != (i = targets[targets.length - 1]) && this.activate(i)
    }

    if (activeTarget && scrollTop < offsets[0]) {
      this.activeTarget = null
      return this.clear()
    }

    for (i = offsets.length; i--;) {
      activeTarget != targets[i]
        && scrollTop >= offsets[i]
        && (offsets[i + 1] === undefined || scrollTop < offsets[i + 1])
        && this.activate(targets[i])
    }
  }

  ScrollSpy.prototype.activate = function (target) {
    this.activeTarget = target

    this.clear()

    var selector = this.selector +
      '[data-target="' + target + '"],' +
      this.selector + '[href="' + target + '"]'

    var active = $(selector)
      .parents('li')
      .addClass('active')

    if (active.parent('.dropdown-menu').length) {
      active = active
        .closest('li.dropdown')
        .addClass('active')
    }

    active.trigger('activate.bs.scrollspy')
  }

  ScrollSpy.prototype.clear = function () {
    $(this.selector)
      .parentsUntil(this.options.target, '.active')
      .removeClass('active')
  }


  // SCROLLSPY PLUGIN DEFINITION
  // ===========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.scrollspy')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.scrollspy', (data = new ScrollSpy(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.scrollspy

  $.fn.scrollspy             = Plugin
  $.fn.scrollspy.Constructor = ScrollSpy


  // SCROLLSPY NO CONFLICT
  // =====================

  $.fn.scrollspy.noConflict = function () {
    $.fn.scrollspy = old
    return this
  }


  // SCROLLSPY DATA-API
  // ==================

  $(window).on('load.bs.scrollspy.data-api', function () {
    $('[data-spy="scroll"]').each(function () {
      var $spy = $(this)
      Plugin.call($spy, $spy.data())
    })
  })

}(jQuery);

},{}],21:[function(require,module,exports){
/* ========================================================================
 * step步骤条组件v1.0.0 2018 
 * ======================================================================== */

+function ($) {
  'use strict';

  // STEP CLASS DEFINITION
  // =========================
  var Step = function (element, options) {
    this.$element  = $(element);
    this.options   = $.extend({}, Step.DEFAULTS, options);
  }

  Step.VERSION  = '1.0.0'

  Step.DEFAULTS = {
    steps: [{
      "name":"步骤1",
      "state":"",//定义状态，success,wait,error，默认success
      "describe":"基本描述"
    },{
      "name":"步骤2",
      "state":"",//定义状态，success,wait,error，默认success
      "describe":"基本描述"
    },{
      "name":"步骤3",
      "state":"",//定义状态，success,wait,error，默认success
      "describe":"基本描述"
    }],
    initStep: 1,
    hasDescribe:false,
    clickable:false,
    size:"default",
    direction:"horizontal"
  };

  
  Step.prototype.goto = function (step) {
    var that = this;
    if (step < 0 || step > that.$element.find("li").length) {
      return;
    }
    that.$element.find("li").removeClass("active");
    that.$element.find("li").removeClass("error");
    that.$element.find("li").removeClass("wait");
    that.$element.find("li").removeClass("success");

    var $target = that.$element.find("li").eq(step - 1);
    $target.addClass("active");
    $target.prevAll("li").addClass("success");


    if(that.$element.find("li").hasClass("small")){
      var oldLi = null;//存放上一个节点
      that.$element.find(".progressbar li").each(function(){
        $(this).children(".extra").removeClass("extra-other");
        $(this).children(".extra").removeClass("extra-error");
        if($(this).hasClass("success")||$(this).hasClass("active")){
          $(this).children(".extra").addClass("extra-other");
        }
        if(oldLi){
          var lang =oldLi.width()*0.5 -16 - oldLi.children("span:first-child").width() - oldLi.width()*0.05;
          $(this).children(".extra").width(lang);
        }
        oldLi = $(this);
      });
    }
    var startEvent = $.Event('changeStep.bs.step',{"stepInfo":{"stepIndex":step,"stepData":that.options.steps[step-1]}});
    that.$element.trigger(startEvent);
  }

  Step.prototype.setStep = function (data) {
    var that = this;
    that.options.steps[data.index-1] = $.extend({},that.options.steps[data.index-1],data.stepData);
    that.init();
  }


  Step.prototype.init = function () {
    var that = this;

    if (that.options.initStep > that.options.steps.length) {
      options.initStep = options.steps.length;
    }

    // 初始化样式
    var html = '';
  
    if(that.options.direction === "vertical"){
      html += '<ul class="progressbar vertical">';
    }else{
      html += '<ul class="progressbar">';
    }

    $.each(that.options.steps, function (index, step) {
      html += '<li';

      if(step.state){
        html += ' class="' + step.state +'" ';
      }else{
        if (index < that.options.initStep-1) {
          html += ' class="success" ';
        }
        if (index == that.options.initStep-1) {
          html += ' class="active" ';
        }
      }
      
      html += '>';

      if(that.options.hasDescribe||that.options.direction === "vertical" ||that.options.size === "small"){
        html += "<span>";
        html += step.name;
        html += "</span>";
        html += "<span>";
        html += that.options.hasDescribe?(step.describe?step.describe:""):"";
        html += "</span>";
      }else{
        html += step.name;
      }
      if(that.options.size === "small"){
        if(index>0){
          html +="<div class='extra'></div>"
        }    
      }
      html += '</li>';
    });
    html += '</ul>';
    that.$element.empty().append(html);
    // 计算宽度或者高度
    if(that.options.direction === "vertical"){
      that.$element.find(".progressbar li").css("height", 100 / this.options.steps.length + "%");
    }else{
      that.$element.find(".progressbar li").css("width", 100 / this.options.steps.length + "%");
    }

    if(that.options.clickable){
      that.$element.find(".progressbar li").addClass("canClick");
    }
    if(that.options.size === "small"){
      that.$element.find(".progressbar li").addClass("small");

      var oldLi = null;//存放上一个节点
      that.$element.find(".progressbar li").each(function(){
          if($(this).hasClass("error")){
            $(this).children(".extra").addClass("extra-error");
          }else if($(this).hasClass("success")||$(this).hasClass("wait")||$(this).hasClass("active")){
            $(this).children(".extra").addClass("extra-other");
          }else{

          }
          if(oldLi){
            var lang =oldLi.width()*0.5 -16 - oldLi.children("span:first-child").width() - 8;
            $(this).children(".extra").width(lang);
          }
          oldLi = $(this);
      });
    }
  }

  // STEP PLUGIN DEFINITION
  // ========================

  function Plugin(option,params) {
    return this.each(function () {
      var data  = $(this).data('bs.step')
      if (typeof option == 'string'&&data) {
        return data[option](params);
      }else if(typeof option == 'string'&&!data){
        $.error('该步骤条未初始化！');
      } else if (typeof option === 'object'&&data ) {
        data.options =  $.extend({}, Step.DEFAULTS,data.options ,option);
        return data.init();
      }else if (typeof option === 'object'&&!data ) {
        $(this).data('bs.step', (data = new Step(this, option)))
        return data.init();
    } else if (!option&&!data ) {
        $(this).data('bs.step', (data = new Step(this, option)))
        return data.init();
    } else if (!option&&data ) {
      return data.init();
    } else {
        $.error('其他错误');
      }
    })
  }

  var old = $.fn.step

  $.fn.step             = Plugin
  $.fn.step.Constructor = Step

  // STEP  NO CONFLICT
  // ===============

  $.fn.step.noConflict = function () {
    $.fn.step = old
    return this
  }

  // STEP DATA-API
  // =================
  $(document).on("click",".progressbar li",function(){
    if($(this).hasClass("canClick")){
      $(this).parent().parent().step("goto",$(this).index()+1);
    }
  })

  $(window).resize(function(){
    $(".progressbar:not(.vertical)").each(function(){
          if($(this).find("li:first").hasClass("small")){
            $(this).parent().data('bs.step').init();
          }
    });
  });

}(jQuery);

},{}],22:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: tab.js v3.3.7
 * http://getbootstrap.com/javascript/#tabs
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // TAB CLASS DEFINITION
  // ====================

  var Tab = function (element) {
    // jscs:disable requireDollarBeforejQueryAssignment
    this.element = $(element)
    // jscs:enable requireDollarBeforejQueryAssignment
  }

  Tab.VERSION = '3.3.7'

  Tab.TRANSITION_DURATION = 150

  Tab.prototype.show = function () {
    var $this    = this.element
    var $ul      = $this.closest('ul:not(.dropdown-menu)')
    var selector = $this.data('target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    if ($this.parent('li').hasClass('active')) return

    var $previous = $ul.find('.active:last a')
    var hideEvent = $.Event('hide.bs.tab', {
      relatedTarget: $this[0]
    })
    var showEvent = $.Event('show.bs.tab', {
      relatedTarget: $previous[0]
    })

    $previous.trigger(hideEvent)
    $this.trigger(showEvent)

    if (showEvent.isDefaultPrevented() || hideEvent.isDefaultPrevented()) return

    var $target = $(selector)

    this.activate($this.closest('li'), $ul)
    this.activate($target, $target.parent(), function () {
      $previous.trigger({
        type: 'hidden.bs.tab',
        relatedTarget: $this[0]
      })
      $this.trigger({
        type: 'shown.bs.tab',
        relatedTarget: $previous[0]
      })
    })
  }

  Tab.prototype.activate = function (element, container, callback) {
    var $active    = container.find('> .active')
    var transition = callback
      && $.support.transition
      && ($active.length && $active.hasClass('fade') || !!container.find('> .fade').length)

    function next() {
      $active
        .removeClass('active')
        .find('> .dropdown-menu > .active')
          .removeClass('active')
        .end()
        .find('[data-toggle="tab"]')
          .attr('aria-expanded', false)

      element
        .addClass('active')
        .find('[data-toggle="tab"]')
          .attr('aria-expanded', true)

      if (transition) {
        element[0].offsetWidth // reflow for transition
        element.addClass('in')
      } else {
        element.removeClass('fade')
      }

      if (element.parent('.dropdown-menu').length) {
        element
          .closest('li.dropdown')
            .addClass('active')
          .end()
          .find('[data-toggle="tab"]')
            .attr('aria-expanded', true)
      }

      callback && callback()
    }

    $active.length && transition ?
      $active
        .one('bsTransitionEnd', next)
        .emulateTransitionEnd(Tab.TRANSITION_DURATION) :
      next()

    $active.removeClass('in')
  }


  // TAB PLUGIN DEFINITION
  // =====================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.tab')

      if (!data) $this.data('bs.tab', (data = new Tab(this)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.tab

  $.fn.tab             = Plugin
  $.fn.tab.Constructor = Tab


  // TAB NO CONFLICT
  // ===============

  $.fn.tab.noConflict = function () {
    $.fn.tab = old
    return this
  }


  // TAB DATA-API
  // ============

  var clickHandler = function (e) {
    e.preventDefault()
    Plugin.call($(this), 'show')
  }

  $(document)
    .on('click.bs.tab.data-api', '[data-toggle="tab"]', clickHandler)
    .on('click.bs.tab.data-api', '[data-toggle="pill"]', clickHandler)

}(jQuery);

},{}],23:[function(require,module,exports){
/* ========================================================================
 * 时间轴: timeline.js v1.0.0 2018
 * ======================================================================== */

+function ($) {
    'use strict';

    // TIMELINE PUBLIC CLASS DEFINITION
    // ===============================

    var Timeline = function (element, options) {
        this.$element = null
        this.options = null

        if (options.loadMore) {
            var loadMore = '[data-loadMore="loadMore"]';
            $(element).on('click.bs.loadMore.timeline', loadMore, this.setloadMore)
        }

        this.init(element, options)
    }

    Timeline.VERSION = '1.0.0'

    //  DOM结构
    Timeline.TEMPLATE = {
        warp: '<ul class="{{timeStyle}}" role="timeline">{{itemContent}}</ul>',
        defaultContent: '<li {{id}} class="{{itemStyle}}"><div class="{{tailStyle}}"></div><div class="{{headStyle}}"></div><div class="timeline-item-content">{{rightContent}}</div></li>',
        centerContent: '<li class="{{itemStyle}}"><div class="timeline-item-content timeline-item-left-content">{{leftContent}}</div><div class="{{tailStyle}}"></div><div class="{{headStyle}}"></div><div class="timeline-item-content timeline-item-right-content">{{rightContent}}</div></li>'
    }

    // 主样式
    Timeline.MAINSTYLE = {
        timeStyle: 'timeline',
        itemStyle: 'timeline-item',
        tailStyle: 'timeline-item-tail',
        headStyle: 'timeline-item-head'
    }

    // 修饰样式
    Timeline.EMBELLISHSTYLE = {
        centerStyle: 'timeline-center',
        lastStyle: 'timeline-item-last',
        pendingStyle: 'timeline-item-tail-pending',
        headCustom: 'timeline-item-head-custom'
    }

    // 颜色样式
    Timeline.COLORSTYLE = {
        default: 'timeline-item-head-default',
        primary: 'timeline-item-head-primary',
        success: 'timeline-item-head-success',
        warning: 'timeline-item-head-warning',
        danger: 'timeline-item-head-danger'
    }

    // 加载更多的数据
    Timeline.LOADMORE = {
        id: 'id = "loadMore"',
        headStyle: "timeline-item-head timeline-item-head-primary ",
        itemStyle: "timeline-item",
        tailStyle: "timeline-item-tail",
        rightContent: '<span class="timeline-item-load-more" data-loadMore="loadMore">加载更多...</span>',
    }


    /**
     * headStyle：时间节点图标的属性
     * tailStyle：时间节点轴线的属性
     * leftContent：时间节点左边内容
     * rightContent：时间节点右边内容
     * customIcon：自定义时间节点图标
     *
     *
     * data:[
     *  {
     *     id:''
           headStyle: 'default',
           tailStyle: 'default',
           leftContent: '',
           rightContent: '',
           customIcon: ''
         }
     * ]
     * **/
    Timeline.DEFAULTS = {
        type: 'default',
        loadMore: false,
        data: []
    }

    // 初始化
    Timeline.prototype.init = function (element, options) {
        this.$element = $(element);
        this.options = this.getOptions(options);

        this.$element.html(this.getTemplate(this.options));
    }

    Timeline.prototype.getDefaults = function () {
        return Timeline.DEFAULTS
    }

    Timeline.prototype.getOptions = function (options) {
        options = $.extend({}, this.getDefaults(), this.$element.data(), options)
        return options
    }


    // 设置类名
    Timeline.prototype.setTemplateClass = function () {
        var str = '';
        Array.prototype.slice.apply(arguments).map(function (t) {
            str += t + ' ';
        })
        return str;
    }

    // 解析data
    Timeline.prototype.getTemplateClass = function (options) {
        var opt = {}, items = [], that = this;
        var sourceDate = options.data.concat();

        if (options.loadMore) sourceDate.push(Timeline.LOADMORE);
        opt.timeStyle = this.getTimelineStyle(options) ? this.setTemplateClass(Timeline.MAINSTYLE.timeStyle, Timeline.EMBELLISHSTYLE.centerStyle) : Timeline.MAINSTYLE.timeStyle;
        if (sourceDate.length > 0) {
            var len = sourceDate.length - 1;
            sourceDate.map(function (v, i) {
                var obj = {};
                obj.id = v.id ? 'id = ' + v.id + '' : '';
                obj.itemStyle = i == len ? that.setTemplateClass(Timeline.MAINSTYLE.itemStyle, Timeline.EMBELLISHSTYLE.lastStyle) : Timeline.MAINSTYLE.itemStyle;
                obj.tailStyle = v.tailStyle == 'pending' ? that.setTemplateClass(Timeline.MAINSTYLE.tailStyle, Timeline.EMBELLISHSTYLE.pendingStyle) : Timeline.MAINSTYLE.tailStyle;
                obj.headStyle = v.customIcon ? that.setTemplateClass(Timeline.MAINSTYLE.headStyle, Timeline.EMBELLISHSTYLE.headCustom, v.customIcon, Timeline.COLORSTYLE[v.headStyle] ? Timeline.COLORSTYLE[v.headStyle] : Timeline.COLORSTYLE.default) : that.setTemplateClass(Timeline.MAINSTYLE.headStyle, Timeline.COLORSTYLE[v.headStyle] ? Timeline.COLORSTYLE[v.headStyle] : Timeline.COLORSTYLE.default);
                obj.rightContent = v.rightContent ? v.rightContent : '';
                if (that.getTimelineStyle(options)) obj.leftContent = v.leftContent ? v.leftContent : '';
                items.push(obj);
            })
        }

        opt.items = items;
        return opt
    }

    // 解析dom结构
    Timeline.prototype.getTemplate = function (options) {
        var opt = this.getTemplateClass(options),
            itemTmp = this.getTimelineStyle(options) ? Timeline.TEMPLATE.centerContent : Timeline.TEMPLATE.defaultContent,
            itemContent = '',
            newObj = {},
            that = this;

        if (opt.items) {
            opt.items.map(function (v) {
                itemContent += that.setTemplate(itemTmp, v)
            })
        }
        newObj.timeStyle = opt.timeStyle;
        newObj.itemContent = itemContent;
        return this.setTemplate(Timeline.TEMPLATE.warp, newObj);
    }

    Timeline.prototype.getTimelineStyle = function (options) {
        return options.type == 'center' ? true : false
    }

    Timeline.prototype.setSourceData = function (data) {
        this.options.data = this.options.data.concat(data);
    }

    // 点击加载更多时的事件
    Timeline.prototype.setloadMore = function () {
        var $this = $(this);
        var startEvent = $.Event('loadMore.bs.timeline');
        $this.trigger(startEvent);
    }

    Timeline.prototype.loadMore = function (obj) {
        if ($.isArray(obj)) {
            this.setSourceData(obj)
            this.$element.html(this.getTemplate(this.options));
        } else {
            return false
        }
    }

    Timeline.prototype.loadMoreEnd = function () {
        this.options.loadMore = false;
    }

    // Template Format
    Timeline.prototype.setTemplate = function (str, model) {
        for (var v in model) {
            var reg = new RegExp("{{" + v + "}}", "g");
            str = str.replace(reg, model[v]);
        }
        return str
    }


    // TIMELINE PLUGIN DEFINITION
    // =========================

    function Plugin(option, obj) {
        return this.each(function () {
            var $this = $(this)
            var data = $this.data('bs.timeline')
            var options = typeof option == 'object' && option

            if (!data) $this.data('bs.timeline', (data = new Timeline(this, options)))
            if (typeof option == 'string') data[option](obj)
        })
    }

    var old = $.fn.timeline

    $.fn.timeline = Plugin
    $.fn.timeline.Constructor = Timeline


    // TIMELINE NO CONFLICT
    // ===================

    $.fn.timeline.noConflict = function () {
        $.fn.timeline = old
        return this
    }

}(jQuery);
},{}],24:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: tooltip.js v3.3.7
 * http://getbootstrap.com/javascript/#tooltip
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // TOOLTIP PUBLIC CLASS DEFINITION
  // ===============================

  var Tooltip = function (element, options) {
    this.type       = null
    this.options    = null
    this.enabled    = null
    this.timeout    = null
    this.hoverState = null
    this.$element   = null
    this.inState    = null

    this.init('tooltip', element, options)
  }

  Tooltip.VERSION  = '3.3.7'

  Tooltip.TRANSITION_DURATION = 150

  Tooltip.DEFAULTS = {
    animation: true,
    placement: 'top',
    selector: false,
    template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
    trigger: 'hover focus',
    title: '',
    delay: 0,
    html: false,
    container: false,
    viewport: {
      selector: 'body',
      padding: 0
    }
  }

  Tooltip.prototype.init = function (type, element, options) {
    this.enabled   = true
    this.type      = type
    this.$element  = $(element)
    this.options   = this.getOptions(options)
    this.$viewport = this.options.viewport && $($.isFunction(this.options.viewport) ? this.options.viewport.call(this, this.$element) : (this.options.viewport.selector || this.options.viewport))
    this.inState   = { click: false, hover: false, focus: false }

    if (this.$element[0] instanceof document.constructor && !this.options.selector) {
      throw new Error('`selector` option must be specified when initializing ' + this.type + ' on the window.document object!')
    }

    var triggers = this.options.trigger.split(' ')

    for (var i = triggers.length; i--;) {
      var trigger = triggers[i]

      if (trigger == 'click') {
        this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this))
      } else if (trigger != 'manual') {
        var eventIn  = trigger == 'hover' ? 'mouseenter' : 'focusin'
        var eventOut = trigger == 'hover' ? 'mouseleave' : 'focusout'

        this.$element.on(eventIn  + '.' + this.type, this.options.selector, $.proxy(this.enter, this))
        this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this))
      }
    }

    this.options.selector ?
      (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
      this.fixTitle()
  }

  Tooltip.prototype.getDefaults = function () {
    return Tooltip.DEFAULTS
  }

  Tooltip.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), this.$element.data(), options)

    if (options.delay && typeof options.delay == 'number') {
      options.delay = {
        show: options.delay,
        hide: options.delay
      }
    }

    return options
  }

  Tooltip.prototype.getDelegateOptions = function () {
    var options  = {}
    var defaults = this.getDefaults()

    this._options && $.each(this._options, function (key, value) {
      if (defaults[key] != value) options[key] = value
    })

    return options
  }

  Tooltip.prototype.enter = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data('bs.' + this.type)

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
      $(obj.currentTarget).data('bs.' + this.type, self)
    }

    if (obj instanceof $.Event) {
      self.inState[obj.type == 'focusin' ? 'focus' : 'hover'] = true
    }

    if (self.tip().hasClass('in') || self.hoverState == 'in') {
      self.hoverState = 'in'
      return
    }

    clearTimeout(self.timeout)

    self.hoverState = 'in'

    if (!self.options.delay || !self.options.delay.show) return self.show()

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'in') self.show()
    }, self.options.delay.show)
  }

  Tooltip.prototype.isInStateTrue = function () {
    for (var key in this.inState) {
      if (this.inState[key]) return true
    }

    return false
  }

  Tooltip.prototype.leave = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data('bs.' + this.type)

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
      $(obj.currentTarget).data('bs.' + this.type, self)
    }

    if (obj instanceof $.Event) {
      self.inState[obj.type == 'focusout' ? 'focus' : 'hover'] = false
    }

    if (self.isInStateTrue()) return

    clearTimeout(self.timeout)

    self.hoverState = 'out'

    if (!self.options.delay || !self.options.delay.hide) return self.hide()

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'out') self.hide()
    }, self.options.delay.hide)
  }

  Tooltip.prototype.show = function () {
    var e = $.Event('show.bs.' + this.type)

    if (this.hasContent() && this.enabled) {
      this.$element.trigger(e)

      var inDom = $.contains(this.$element[0].ownerDocument.documentElement, this.$element[0])
      if (e.isDefaultPrevented() || !inDom) return
      var that = this

      var $tip = this.tip()

      var tipId = this.getUID(this.type)

      this.setContent()
      $tip.attr('id', tipId)
      this.$element.attr('aria-describedby', tipId)

      if (this.options.animation) $tip.addClass('fade')

      var placement = typeof this.options.placement == 'function' ?
        this.options.placement.call(this, $tip[0], this.$element[0]) :
        this.options.placement

      var autoToken = /\s?auto?\s?/i
      var autoPlace = autoToken.test(placement)
      if (autoPlace) placement = placement.replace(autoToken, '') || 'top'

      $tip
        .detach()
        .css({ top: 0, left: 0, display: 'block' })
        .addClass(placement)
        .data('bs.' + this.type, this)

      this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element)
      this.$element.trigger('inserted.bs.' + this.type)

      var pos          = this.getPosition()
      var actualWidth  = $tip[0].offsetWidth
      var actualHeight = $tip[0].offsetHeight

      if (autoPlace) {
        var orgPlacement = placement
        var viewportDim = this.getPosition(this.$viewport)
        if(placement == 'bottom' && pos.bottom + actualHeight > viewportDim.bottom ){
            placement = 'top';
        }
        if(placement == 'bottom-left' ){
            placement = (pos.bottom + actualHeight > viewportDim.bottom) ? 'top-left' :
                        placement
        }
        if(placement == 'bottom-right' ){
            placement = (pos.bottom + actualHeight > viewportDim.bottom) ? 'top-right' :
                        placement
        }
        if(placement == 'top'    && pos.top    - actualHeight < viewportDim.top){
            placement = 'bottom';
        }
        if(placement == 'top-left'){
           placement = (pos.top    - actualHeight < viewportDim.top) ? 'bottom-left' :
                        placement
        }
        if(placement == 'top-right'){
            placement = (pos.top    - actualHeight < viewportDim.top) ? 'bottom-right' :
                        placement
        }
        if(placement == 'right'  && pos.right  + actualWidth  > viewportDim.width){
            placement = 'left';
        }
        if(placement == 'right-top' ){
            placement = (pos.right  + actualWidth  > viewportDim.width) ? 'left-top' :
                        placement
        }
        if(placement == 'right-bottom' ){
            placement = (pos.right  + actualWidth  > viewportDim.width) ? 'left-bottom' :
                        placement
        }
        if(placement == 'left'   && pos.left   - actualWidth  < viewportDim.left ){
            placement = 'right';
        }
        if(placement == 'left-top' ){
            placement = (pos.left   - actualWidth  < viewportDim.left) ? 'right-top' :
                        placement
        }
        if(placement == 'left-bottom' ){
            placement = (pos.left   - actualWidth  < viewportDim.left) ? 'right-bottom' :
                        placement
        }

        $tip
          .removeClass(orgPlacement)
          .addClass(placement)
      }

      var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight)

      this.applyPlacement(calculatedOffset, placement)

      var complete = function () {
        var prevHoverState = that.hoverState
        /**
         * start
         * 2018-4-16 增加that.$element不为空的判断
         */
        if (that.$element) {
            that.$element.trigger('shown.bs.' + that.type)
        }
        /**
         * end
         */
        that.hoverState = null

        if (prevHoverState == 'out') that.leave(that)
      }

      $.support.transition && this.$tip.hasClass('fade') ?
        $tip
          .one('bsTransitionEnd', complete)
          .emulateTransitionEnd(Tooltip.TRANSITION_DURATION) :
        complete()
    }
  }

  Tooltip.prototype.applyPlacement = function (offset, placement) {
    var $tip   = this.tip()
    var width  = $tip[0].offsetWidth
    var height = $tip[0].offsetHeight

    // manually read margins because getBoundingClientRect includes difference
    var marginTop = parseInt($tip.css('margin-top'), 10)
    var marginLeft = parseInt($tip.css('margin-left'), 10)

    // we must check for NaN for ie 8/9
    if (isNaN(marginTop))  marginTop  = 0
    if (isNaN(marginLeft)) marginLeft = 0

    offset.top  += marginTop
    offset.left += marginLeft

    // $.fn.offset doesn't round pixel values
    // so we use setOffset directly with our own function B-0
    $.offset.setOffset($tip[0], $.extend({
      using: function (props) {
        $tip.css({
          top: Math.round(props.top),
          left: Math.round(props.left)
        })
      }
    }, offset), 0)

    $tip.addClass('in')

    // check to see if placing tip in new offset caused the tip to resize itself
    var actualWidth  = $tip[0].offsetWidth
    var actualHeight = $tip[0].offsetHeight

    if (placement == 'top' && actualHeight != height) {
      offset.top = offset.top + height - actualHeight
    }

    var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight)

    if (delta.left) offset.left += delta.left
    else offset.top += delta.top

    var isVertical          = /^[top|bottom]/.test(placement)
    var arrowDelta          = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight
    var arrowOffsetPosition = isVertical ? 'offsetWidth' : 'offsetHeight'

    $tip.offset(offset)
    /** start 为了让箭头定在不同位置 注释 2018-8-1 */
    // this.replaceArrow(arrowDelta, $tip[0][arrowOffsetPosition], isVertical)
    /** end 为了让箭头定在不同位置 注释 2018-8-1 */
  }

  Tooltip.prototype.replaceArrow = function (delta, dimension, isVertical) {
    this.arrow()
      .css(isVertical ? 'left' : 'top', 50 * (1 - delta / dimension) + '%')
      .css(isVertical ? 'top' : 'left', '')
  }

  Tooltip.prototype.setContent = function () {
    var $tip  = this.tip()
    var title = this.getTitle()

    $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title)
    $tip.removeClass('fade in top top-left top-right bottom bottom-left bottom-right left left-top left-bottom right right-top right-bottom')
  }

  Tooltip.prototype.hide = function (callback) {
    var that = this
    var $tip = $(this.$tip)
    var e    = $.Event('hide.bs.' + this.type)

    function complete() {
      if (that.hoverState != 'in') $tip.detach()
      if (that.$element) { // TODO: Check whether guarding this code with this `if` is really necessary.
        that.$element
          .removeAttr('aria-describedby')
          .trigger('hidden.bs.' + that.type)
      }
      callback && callback()
    }

    this.$element.trigger(e)

    if (e.isDefaultPrevented()) return

    $tip.removeClass('in')

    $.support.transition && $tip.hasClass('fade') ?
      $tip
        .one('bsTransitionEnd', complete)
        .emulateTransitionEnd(Tooltip.TRANSITION_DURATION) :
      complete()

    this.hoverState = null

    return this
  }

  Tooltip.prototype.fixTitle = function () {
    var $e = this.$element
    if ($e.attr('title') || typeof $e.attr('data-original-title') != 'string') {
      $e.attr('data-original-title', $e.attr('title') || '').attr('title', '')
    }
  }

  Tooltip.prototype.hasContent = function () {
    return this.getTitle()
  }

  Tooltip.prototype.getPosition = function ($element) {
    $element   = $element || this.$element

    var el     = $element[0]
    var isBody = el.tagName == 'BODY'

    var elRect    = el.getBoundingClientRect()
    if (elRect.width == null) {
      // width and height are missing in IE8, so compute them manually; see https://github.com/twbs/bootstrap/issues/14093
      elRect = $.extend({}, elRect, { width: elRect.right - elRect.left, height: elRect.bottom - elRect.top })
    }
    var isSvg = window.SVGElement && el instanceof window.SVGElement
    // Avoid using $.offset() on SVGs since it gives incorrect results in jQuery 3.
    // See https://github.com/twbs/bootstrap/issues/20280
    var elOffset  = isBody ? { top: 0, left: 0 } : (isSvg ? null : $element.offset())
    var scroll    = { scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop() }
    var outerDims = isBody ? { width: $(window).width(), height: $(window).height() } : null

    return $.extend({}, elRect, scroll, outerDims, elOffset)
  }

  Tooltip.prototype.getCalculatedOffset = function (placement, pos, actualWidth, actualHeight) {
    return  placement == 'right-top' ? { top: pos.top,   left: pos.left + pos.width } :
            placement == 'right-bottom' ? { top: pos.top + pos.height  - actualHeight,   left:  pos.left + pos.width } :
            placement == 'left-top' ? { top: pos.top,   left: pos.left - actualWidth } :
            placement == 'left-bottom' ? { top: pos.top + pos.height  - actualHeight,   left: pos.left - actualWidth } :
            placement == 'top-left' ? { top: pos.top - actualHeight,   left: pos.left } :
            placement == 'top-right' ? { top: pos.top - actualHeight,   left: pos.left + pos.width - actualWidth } :
            placement == 'bottom-left' ? { top: pos.top + pos.height,   left: pos.left } :
            placement == 'bottom-right' ? { top: pos.top + pos.height,   left: pos.left + pos.width - actualWidth } :
            placement == 'bottom' ? { top: pos.top + pos.height,   left: pos.left + pos.width / 2 - actualWidth / 2 } :
            placement == 'top'    ? { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2 } :
            placement == 'left'   ? { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth } :
            /* placement == 'right' */ { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width }

  }

  Tooltip.prototype.getViewportAdjustedDelta = function (placement, pos, actualWidth, actualHeight) {
    var delta = { top: 0, left: 0 }
    if (!this.$viewport) return delta

    var viewportPadding = this.options.viewport && this.options.viewport.padding || 0
    var viewportDimensions = this.getPosition(this.$viewport)

    if (/right|left/.test(placement)) {
      var topEdgeOffset    = pos.top - viewportPadding - viewportDimensions.scroll
      var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight
      if (topEdgeOffset < viewportDimensions.top) { // top overflow
        delta.top = viewportDimensions.top - topEdgeOffset
      } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) { // bottom overflow
        delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset
      }
    } else {
      var leftEdgeOffset  = pos.left - viewportPadding
      var rightEdgeOffset = pos.left + viewportPadding + actualWidth
      if (leftEdgeOffset < viewportDimensions.left) { // left overflow
        delta.left = viewportDimensions.left - leftEdgeOffset
      } else if (rightEdgeOffset > viewportDimensions.right) { // right overflow
        delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset
      }
    }

    return delta
  }

  Tooltip.prototype.getTitle = function () {
    var title
    var $e = this.$element
    var o  = this.options

    title = $e.attr('data-original-title')
      || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

    return title
  }

  Tooltip.prototype.getUID = function (prefix) {
    do prefix += ~~(Math.random() * 1000000)
    while (document.getElementById(prefix))
    return prefix
  }

  Tooltip.prototype.tip = function () {
    if (!this.$tip) {
      this.$tip = $(this.options.template)
      if (this.$tip.length != 1) {
        throw new Error(this.type + ' `template` option must consist of exactly 1 top-level element!')
      }
    }
    return this.$tip
  }

  Tooltip.prototype.arrow = function () {
    return (this.$arrow = this.$arrow || this.tip().find('.tooltip-arrow'))
  }

  Tooltip.prototype.enable = function () {
    this.enabled = true
  }

  Tooltip.prototype.disable = function () {
    this.enabled = false
  }

  Tooltip.prototype.toggleEnabled = function () {
    this.enabled = !this.enabled
  }

  Tooltip.prototype.toggle = function (e) {
    var self = this
    if (e) {
      self = $(e.currentTarget).data('bs.' + this.type)
      if (!self) {
        self = new this.constructor(e.currentTarget, this.getDelegateOptions())
        $(e.currentTarget).data('bs.' + this.type, self)
      }
    }

    if (e) {
      self.inState.click = !self.inState.click
      if (self.isInStateTrue()) self.enter(self)
      else self.leave(self)
    } else {
      self.tip().hasClass('in') ? self.leave(self) : self.enter(self)
    }
  }

  Tooltip.prototype.destroy = function () {
    var that = this
    clearTimeout(this.timeout)
    this.hide(function () {
        /**
         * start
         * 2018-4-16 增加that.$element不为空的判断
         */
       if (that.$element) {
            that.$element.off('.' + that.type).removeData('bs.' + that.type)
       } 
        /**
         * end
         */     
      if (that.$tip) {
        that.$tip.detach()
      }
      that.$tip = null
      that.$arrow = null
      that.$viewport = null
      that.$element = null
    })
  }


  // TOOLTIP PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.tooltip')
      var options = typeof option == 'object' && option

      if (!data && /destroy|hide/.test(option)) return
      if (!data) $this.data('bs.tooltip', (data = new Tooltip(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.tooltip

  $.fn.tooltip             = Plugin
  $.fn.tooltip.Constructor = Tooltip


  // TOOLTIP NO CONFLICT
  // ===================

  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old
    return this
  }

}(jQuery);

},{}],25:[function(require,module,exports){
/* ========================================================================
 * Bootstrap: transition.js v3.3.7
 * http://getbootstrap.com/javascript/#transitions
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
  // ============================================================

  function transitionEnd() {
    var el = document.createElement('bootstrap')

    var transEndEventNames = {
      WebkitTransition : 'webkitTransitionEnd',
      MozTransition    : 'transitionend',
      OTransition      : 'oTransitionEnd otransitionend',
      transition       : 'transitionend'
    }

    for (var name in transEndEventNames) {
      if (el.style[name] !== undefined) {
        return { end: transEndEventNames[name] }
      }
    }

    return false // explicit for ie8 (  ._.)
  }

  // http://blog.alexmaccaw.com/css-transitions
  $.fn.emulateTransitionEnd = function (duration) {
    var called = false
    var $el = this
    $(this).one('bsTransitionEnd', function () { called = true })
    var callback = function () { if (!called) $($el).trigger($.support.transition.end) }
    setTimeout(callback, duration)
    return this
  }

  $(function () {
    $.support.transition = transitionEnd()

    if (!$.support.transition) return

    $.event.special.bsTransitionEnd = {
      bindType: $.support.transition.end,
      delegateType: $.support.transition.end,
      handle: function (e) {
        if ($(e.target).is(this)) return e.handleObj.handler.apply(this, arguments)
      }
    }
  })

}(jQuery);

},{}],26:[function(require,module,exports){
/**
 * fhui v0.0.1
 */

// boostrap
require("./bootstrap/javascripts/bootstrap");

// ecology
require("./bootstrap-extend/ecology/pagin/index");
require("./bootstrap-extend/ecology/dialog/index"); 
},{"./bootstrap-extend/ecology/dialog/index":1,"./bootstrap-extend/ecology/pagin/index":2,"./bootstrap/javascripts/bootstrap":3}]},{},[26])(26)
});