// Portfolio Website JavaScript
// Author: tai
// Description: Interactive features and animations for portfolio website

document.addEventListener('DOMContentLoaded', function() {
    // Prevent browser from auto-jumping to a fragment identifier on initial load.
    // If there's a hash in the URL we temporarily remove it (without creating a new history entry)
    // and restore it after initialization using replaceState (which does not scroll).
    try {
        const initialHash = window.location.hash;
        if (initialHash && history && history.replaceState) {
            // remove the fragment so the browser won't scroll to it during load
            history.replaceState(null, '', window.location.pathname + window.location.search);
            // save to restore later
            window.__initialFragment = initialHash;
        }
    } catch (e) {
        // ignore errors (older browsers)
    }

    // Initialize all functionality
    initNavigation();
    initScrollAnimations();
    initSkillBars();
    initSkillGrid();
    initContactForm();
    initLoadingScreen();
    initParallaxEffects();
    initTypingAnimation();
    initTimeline();
    initSplitTimeline();
    initSkillTabs();

    // Restore fragment in URL without causing a scroll (replaceState doesn't trigger scrolling)
    try {
        if (window.__initialFragment && history && history.replaceState) {
            history.replaceState(null, '', window.location.pathname + window.location.search + window.__initialFragment);
            delete window.__initialFragment;
        }
    } catch (e) {
        // ignore
    }
});

// Safety: if a loading overlay remains for any reason, remove it when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const loading = document.querySelector('.loading');
    if (loading && document.body.contains(loading)) {
        try { loading.parentElement.removeChild(loading); } catch (e) {}
    }
});

// Navigation functionality
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on links
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 70; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar background change on scroll
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 10, 0.98)';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
        }
    });

    // Active navigation link highlighting
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

// Minimal timeline tab switching for the split timeline
function initSplitTimeline() {
    const tabs = Array.from(document.querySelectorAll('.timeline-tab'));
    if (!tabs.length) return;

    function activate(tab) {
        tabs.forEach(t => {
            t.setAttribute('aria-selected', 'false');
            t.setAttribute('tabindex', '-1');
        });
        const panelId = tab.getAttribute('aria-controls');
        const panels = document.querySelectorAll('.timeline-panel');
        panels.forEach(p => p.setAttribute('hidden', ''));

        tab.setAttribute('aria-selected', 'true');
        tab.setAttribute('tabindex', '0');
        const panel = document.getElementById(panelId);
        if (panel) panel.removeAttribute('hidden');
        if (panel) { panel.setAttribute('tabindex','-1'); panel.focus({preventScroll:true}); }
    }

    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => activate(tab));
        tab.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); tabs[(i+1)%tabs.length].focus(); }
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); tabs[(i-1+tabs.length)%tabs.length].focus(); }
            if (e.key === 'Home') { e.preventDefault(); tabs[0].focus(); }
            if (e.key === 'End') { e.preventDefault(); tabs[tabs.length-1].focus(); }
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(tab); }
        });
    });

    // Activate first tab by default
    activate(tabs[0]);
}

// Timeline interaction: desktop uses left list + right details; mobile shows inline details
function initTimeline() {
    const items = document.querySelectorAll('.timeline-item');
    if (!items || items.length === 0) return;

    const panels = document.querySelectorAll('.timeline-details .panel');

    function activateItem(item, pushState = false, doScroll = true) {
        // deselect all
        items.forEach(i => {
            i.setAttribute('aria-selected', 'false');
            i.classList.remove('open');
            i.setAttribute('aria-expanded', 'false');
        });

        item.setAttribute('aria-selected', 'true');
        item.classList.add('open');
        item.setAttribute('aria-expanded', 'true');

        const panelId = item.getAttribute('data-panel');
        panels.forEach(p => {
            if (p.id === panelId) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
        });

        if (pushState && history && history.replaceState) {
            history.replaceState({}, '', `#${item.id}`);
        }
        // focus the associated panel for keyboard/screen-reader users
        const panelEl = document.getElementById(panelId);
        if (panelEl) {
            panelEl.setAttribute('tabindex', '-1');
            panelEl.focus({ preventScroll: true });
            // small scroll so the panel is visible nicely for interactive activations
            if (doScroll) {
                setTimeout(() => panelEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 40);
            }
        }
        // update the left connector highlight height (desktop)
        updateConnectorToItem(item);

        // apply a visible focus highlight for keyboard users
        items.forEach(i => i.classList.remove('focused'));
        item.classList.add('focused');
    }

    function toggleMobileItem(item) {
        const isOpen = item.classList.contains('open');
        if (isOpen) {
            item.classList.remove('open');
            item.setAttribute('aria-expanded', 'false');
        } else {
            // close others for accordion behavior
            items.forEach(i => { i.classList.remove('open'); i.setAttribute('aria-expanded','false'); });
            item.classList.add('open');
            item.setAttribute('aria-expanded', 'true');
            // ensure the opened item is visible
            setTimeout(() => item.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
        }
    }

    items.forEach(item => {
        item.setAttribute('aria-expanded', item.getAttribute('aria-selected') === 'true' ? 'true' : 'false');

        item.addEventListener('click', function(e) {
            // Always activate the right-side panel for consistency (no duplicate mobile content)
            activateItem(item, true);
        });

        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.click();
            }
            // Arrow navigation
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                const next = item.nextElementSibling || items[0];
                next.focus();
            }
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const prev = item.previousElementSibling || items[items.length -1];
                prev.focus();
            }
        });
    });

    // Activate from hash if present
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        const byHash = document.getElementById(hash);
        if (byHash && byHash.classList.contains('timeline-item')) {
            // activate without forcing a scroll on initial load
            activateItem(byHash, false, false);
        } else {
            activateItem(items[0], false, false);
        }
    } else {
        // ensure initial activation does not jump the page away from the hero
        activateItem(items[0], false, false);
    }

    // When resizing to desktop, close mobile-only open states and ensure panel matches selected
    window.addEventListener('resize', function() {
        // Ensure panels reflect aria-selected on resize
        const selected = document.querySelector('.timeline-item[aria-selected="true"]');
        if (selected) activateItem(selected, false, false);
    });

    // update connector when the left column scrolls (sticky container)
    const leftCol = document.querySelector('.timeline-items');
    if (leftCol) {
        leftCol.addEventListener('scroll', function() {
            const selected = document.querySelector('.timeline-item[aria-selected="true"]');
            if (selected) updateConnectorToItem(selected);
        });
    }

    function updateConnectorToItem(item) {
        // compute from top of left column to the center of item's dot
        const left = document.querySelector('.timeline-items');
        if (!left || window.innerWidth <= 991) return;
        const leftRect = left.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        // compute center using the new pill element if present
        const pill = item.querySelector('.timeline-pill');
        let dotCenter = itemRect.top - leftRect.top + (itemRect.height / 2);
        if (pill) {
            const pillRect = pill.getBoundingClientRect();
            dotCenter = (pillRect.top - leftRect.top) + (pillRect.height / 2);
        }
        const height = Math.max(0, dotCenter + 8) + 'px';
        document.documentElement.style.setProperty('--timeline-active-height', height);
    }
}

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Add fade-in class to elements
    const animateElements = document.querySelectorAll('.project-card, .skill-item, .stat, .contact-method');
    animateElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
}

// Variant B: initialize skill tabs and panel switching
function initSkillTabs() {
    const tablists = document.querySelectorAll('.tabs');
    if (!tablists || tablists.length === 0) return;

    tablists.forEach(list => {
        const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
        tabs.forEach(tab => {
            tab.addEventListener('click', () => activateTab(tab));
            tab.addEventListener('keydown', (e) => {
                let idx = tabs.indexOf(tab);
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const next = tabs[(idx + 1) % tabs.length]; next.focus();
                }
                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prev = tabs[(idx - 1 + tabs.length) % tabs.length]; prev.focus();
                }
                if (e.key === 'Home') { e.preventDefault(); tabs[0].focus(); }
                if (e.key === 'End') { e.preventDefault(); tabs[tabs.length - 1].focus(); }
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateTab(tab); }
            });
        });
    });

    function activateTab(tab) {
        // Deselect all tabs globally so only one panel visible
        const allTabs = document.querySelectorAll('[role="tab"]');
        allTabs.forEach(t => t.setAttribute('aria-selected', 'false'));
        tab.setAttribute('aria-selected', 'true');

        // hide all panels, then show the one for this tab
        const panels = document.querySelectorAll('.skills-panel');
        panels.forEach(p => p.setAttribute('hidden', ''));
        const panelId = tab.getAttribute('data-panel');
        const panel = document.getElementById(panelId);
        if (panel) panel.removeAttribute('hidden');
    }

    // Activate first selected or default
    const first = document.querySelector('[role="tab"][aria-selected="true"]') || document.querySelector('[role="tab"]');
    if (first) activateTab(first);
}

// Skill bars animation
function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress');
    
    const skillObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const skillBar = entry.target;
                const width = skillBar.getAttribute('data-width');
                
                setTimeout(() => {
                    skillBar.style.width = width;
                }, 200);
                
                skillObserver.unobserve(skillBar);
            }
        });
    }, { threshold: 0.5 });

    skillBars.forEach(bar => {
        skillObserver.observe(bar);
    });
}

// Variant A: animate grid skill cards' progress bars when they appear
function initSkillGrid() {
    const cards = document.querySelectorAll('.skill-card');
    if (!cards || cards.length === 0) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const card = entry.target;
            const percent = parseInt(card.getAttribute('data-percent') || '0', 10);
            const bar = card.querySelector('.skill-bar');
            const fill = card.querySelector('.skill-bar-fill');

            if (fill) {
                // set width to percent and let CSS handle the transition
                fill.style.width = percent + '%';
            }

            if (bar) {
                // update accessible value
                bar.setAttribute('aria-valuenow', String(percent));
            }

            // stop observing this card so animation runs only once
            obs.unobserve(card);
        });
    }, { threshold: 0.35 });

    cards.forEach(c => observer.observe(c));
}

// Contact form functionality
function initContactForm() {
    const form = document.querySelector('.contact-form');
    
    if (form) {
        // On some mobile browsers overlays or fast touch handlers can prevent the
        // virtual keyboard from appearing. Add passive touchstart handlers to
        // explicitly focus the field on touch, which avoids flicker on iOS/Android.
        const inputs = Array.from(form.querySelectorAll('input, textarea, button'));
        inputs.forEach(inp => {
            // Only attach for touch capable devices
            inp.addEventListener('touchstart', function(ev) {
                // If element is not focused, focus it. Use a tiny delay to avoid
                // interfering with other gesture handlers.
                if (document.activeElement !== this) {
                    setTimeout(() => { try { this.focus(); } catch(e){} }, 50);
                }
            }, { passive: true });
        });

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(form);
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');

            // Simple validation
            if (!name || !email || !subject || !message) {
                showNotification('Please fill in all fields', 'error');
                return;
            }
            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }

            // UI: disable submit button while posting
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.textContent : null;
            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }

            // Helper to actually POST the FormData
            function doPost(formDataToSend) {
                const action = form.getAttribute('action') || 'https://api.web3forms.com/submit';
                // Log the request target and field names (not values) to help debugging
                try {
                    const keys = [];
                    for (const pair of formDataToSend.entries()) keys.push(pair[0]);
                    console.debug('Submitting contact form to', action, 'fields:', keys);
                } catch (e) {}

                return fetch(action, {
                    method: 'POST',
                    body: formDataToSend,
                    headers: { 'Accept': 'application/json' }
                });
            }

            // Unified handler that consumes a fetch promise and handles success/error
            function handlePostPromise(promise) {
                promise.then(async (res) => {
                    let text = null;
                    try { text = await res.text(); } catch (e) { text = null; }
                    // Try parse JSON if possible
                    let json = null;
                    try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }

                    if (!res.ok) {
                        console.error('Form submit HTTP error', res.status, res.statusText, text);
                        const serverMessage = (json && json.message) ? json.message : (text || res.statusText);
                        showNotification('Submission failed: ' + serverMessage, 'error');
                        return;
                    }

                    // Success path (res.ok)
                    if (json && json.success) {
                        showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
                        form.reset();
                    } else if (json && !json.success) {
                        const msg = json.message || JSON.stringify(json);
                        console.warn('Form submit returned non-success JSON', json);
                        showNotification('Submission problem: ' + msg, 'error');
                    } else {
                        // If no JSON, assume text response is okay
                        console.info('Form submit raw response', text);
                        showNotification('Message sent (no JSON response).', 'success');
                        form.reset();
                    }
                }).catch((err) => {
                    console.error('Form submit error', err);
                    showNotification('Submission failed (network). Please check console for details.', 'error');
                }).finally(() => {
                    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalBtnText || 'Send Message'; }
                });
            }

            // If the form requests reCAPTCHA v3, load script and fetch token first
            const recaptchaSiteKey = form.getAttribute('data-recaptcha-sitekey') || form.dataset.recaptchaSitekey;
            if (recaptchaSiteKey && window.grecaptcha) {
                // grecaptcha already available
                window.grecaptcha.ready(() => {
                    window.grecaptcha.execute(recaptchaSiteKey, { action: 'contact' }).then(function(token) {
                        formData.set('g-recaptcha-response', token);
                        handlePostPromise(doPost(formData));
                    });
                });
            } else if (recaptchaSiteKey && !window.grecaptcha) {
                // Load grecaptcha script dynamically then execute
                const script = document.createElement('script');
                script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`;
                script.async = true;
                script.defer = true;
                script.onload = function() {
                    if (window.grecaptcha) {
                        window.grecaptcha.ready(() => {
                            window.grecaptcha.execute(recaptchaSiteKey, { action: 'contact' }).then(function(token) {
                                formData.set('g-recaptcha-response', token);
                                handlePostPromise(doPost(formData));
                            });
                        });
                    } else {
                        // fallback to posting without token
                        doPost(formData);
                    }
                };
                document.head.appendChild(script);
            } else {
                // No reCAPTCHA requested — post directly
                handlePostPromise(doPost(formData));
            }
        });
    }
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '10px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out',
        maxWidth: '300px',
        wordWrap: 'break-word'
    });
    
    // Set background color based on type
    const colors = {
        success: '#4ecdc4',
        error: '#ff6b6b',
        info: '#00d4ff'
    };
    notification.style.background = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// Loading screen
function initLoadingScreen() {
    const loadingScreen = document.createElement('div');
    loadingScreen.className = 'loading';
    loadingScreen.innerHTML = `
        <div class="loading-typed">
            <span class="loading-text" aria-hidden="true"></span>
            <span class="loading-caret">|</span>
        </div>
    `;
    
    document.body.appendChild(loadingScreen);
    
    // Typing loop for the loading screen: continuously type 'tai' and delete
    const loadingText = loadingScreen.querySelector('.loading-text');
    const loadingCaret = loadingScreen.querySelector('.loading-caret');
    let loadIndex = 0;
    const loadStr = 'tai';
    const loadTypingSpeed = 120;
    const loadDeletingSpeed = 80;
    const pauseAfter = 500;
    let loadingInterval;

    function startLoadingTyping() {
        // type forward
        loadIndex = 0;
        function stepType() {
            if (loadIndex <= loadStr.length) {
                loadingText.textContent = loadStr.slice(0, loadIndex);
                loadIndex++;
                loadingInterval = setTimeout(stepType, loadTypingSpeed);
            } else {
                setTimeout(() => stepDelete(loadIndex - 1), pauseAfter);
            }
        }

        function stepDelete(idx) {
            if (idx >= 0) {
                loadingText.textContent = loadStr.slice(0, idx);
                loadingInterval = setTimeout(() => stepDelete(idx - 1), loadDeletingSpeed);
            } else {
                // loop
                setTimeout(stepType, 150);
            }
        }

        stepType();
    }

    startLoadingTyping();

    // Remove loading screen after page load
    window.addEventListener('load', function() {
        clearTimeout(loadingInterval);
        loadingScreen.style.transition = 'opacity 150ms ease';
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(loadingScreen)) document.body.removeChild(loadingScreen);
        }, 160);
    });

    // Safety fallback: if the page doesn't fire load (ad blockers etc.), remove after 6s
    setTimeout(() => {
        if (document.body.contains(loadingScreen)) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(loadingScreen)) document.body.removeChild(loadingScreen);
            }, 180);
        }
    }, 6000);
}

// Parallax effects
function initParallaxEffects() {
    const floatingElements = document.querySelectorAll('.element');
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        floatingElements.forEach((element, index) => {
            const speed = (index + 1) * 0.1;
            element.style.transform = `translateY(${rate * speed}px)`;
        });
    });
}

// Typing animation for hero title
function initTypingAnimation() {
    // Polished typing: type 'kelvin tai' (lowercase) left-to-right then backspace right-to-left
    // until 'tai' remains. This follows the more common pattern used in hero animations.
    const typedEl = document.querySelector('.typed-name');
    const caretEl = document.querySelector('.typing-caret');
    if (!typedEl) return;

    const full = 'kelvin tai';
    const finalKeep = 'tai';
    const typingSpeed = 90; // ms per character when typing (slightly faster)
    const backspaceSpeed = 60; // ms per character when backspacing
    const pauseAfterFull = 700; // pause after full name typed

    function startAnimation() {
        let i = 0;

        function typeNext() {
            if (i <= full.length) {
                typedEl.textContent = full.slice(0, i);
                i++;
                setTimeout(typeNext, typingSpeed);
            } else {
                // fully typed, then delete characters from the left until finalKeep remains
                setTimeout(() => deleteFromLeft(0), pauseAfterFull);
            }
        }

        // Delete characters from the left until only finalKeep remains
        function deleteFromLeft(leftIndex) {
            const remaining = full.slice(leftIndex);
            // when remaining equals finalKeep, we're done
            if (remaining.toLowerCase() === finalKeep) {
                typedEl.textContent = finalKeep;
                // add final class for subtle pop/fade animation
                typedEl.classList.add('final');
                setTimeout(() => { if (caretEl) caretEl.style.opacity = '0'; }, 300);
                return;
            }

            // show the current remaining string and schedule next left deletion
            typedEl.textContent = remaining;
            setTimeout(() => deleteFromLeft(leftIndex + 1), backspaceSpeed);
        }

        // start typing
        typedEl.textContent = '';
        if (caretEl) { caretEl.style.opacity = '1'; caretEl.style.transition = 'opacity 160ms ease'; }
        setTimeout(typeNext, 60);
    }

    // Start when DOM content loaded so animation runs promptly
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        startAnimation();
    } else {
        document.addEventListener('DOMContentLoaded', startAnimation);
    }
}

// Mouse cursor effects
document.addEventListener('mousemove', function(e) {
    const cursor = document.querySelector('.custom-cursor');
    if (!cursor) {
        const newCursor = document.createElement('div');
        newCursor.className = 'custom-cursor';
        newCursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, rgba(0, 212, 255, 0.8) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transition: transform 0.1s ease;
        `;
        document.body.appendChild(newCursor);
    }
    
    const customCursor = document.querySelector('.custom-cursor');
    customCursor.style.left = e.clientX - 10 + 'px';
    customCursor.style.top = e.clientY - 10 + 'px';
});

// Hover effects for interactive elements
document.addEventListener('mouseover', function(e) {
    if (e.target.matches('.btn, .nav-link, .project-card, .stat')) {
        const customCursor = document.querySelector('.custom-cursor');
        if (customCursor) {
            customCursor.style.transform = 'scale(1.5)';
            customCursor.style.background = 'radial-gradient(circle, rgba(78, 205, 196, 0.8) 0%, transparent 70%)';
        }
    }
});

document.addEventListener('mouseout', function(e) {
    if (e.target.matches('.btn, .nav-link, .project-card, .stat')) {
        const customCursor = document.querySelector('.custom-cursor');
        if (customCursor) {
            customCursor.style.transform = 'scale(1)';
            customCursor.style.background = 'radial-gradient(circle, rgba(0, 212, 255, 0.8) 0%, transparent 70%)';
        }
    }
});

// Scroll to top functionality
function createScrollToTop() {
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.innerHTML = '↑';
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #00d4ff, #4ecdc4);
        color: white;
        border: none;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
    `;
    
    document.body.appendChild(scrollToTopBtn);
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            scrollToTopBtn.style.opacity = '1';
            scrollToTopBtn.style.visibility = 'visible';
        } else {
            scrollToTopBtn.style.opacity = '0';
            scrollToTopBtn.style.visibility = 'hidden';
        }
    });
    
    // Scroll to top when clicked
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Initialize scroll to top button
createScrollToTop();

// Particle system for hero section
function createParticleSystem() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    const particleContainer = document.createElement('div');
    particleContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: hidden;
    `;
    
    hero.appendChild(particleContainer);
    
    // Create particles
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(0, 212, 255, 0.5);
            border-radius: 50%;
            animation: float ${3 + Math.random() * 4}s ease-in-out infinite;
            animation-delay: ${Math.random() * 2}s;
        `;
        
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        
        particleContainer.appendChild(particle);
    }
}

// Initialize particle system
createParticleSystem();

// Performance optimization: Throttle scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Apply throttling to scroll events
window.addEventListener('scroll', throttle(function() {
    // Scroll-based animations and effects
}, 16)); // ~60fps

// Console welcome message
console.log(`
%cWelcome to tai's Portfolio! 🚀
%cBuilt with ❤️ using modern web technologies
%cFeel free to explore the code and reach out if you have any questions!
`, 
'color: #00d4ff; font-size: 16px; font-weight: bold;',
'color: #4ecdc4; font-size: 14px;',
'color: #ff6b6b; font-size: 12px;'
);
