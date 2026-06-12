document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       1. HEADER scrolled & MOBILE NAVIGATION
       ========================================== */
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    const burger = document.getElementById('burger-menu-btn');
    const drawer = document.getElementById('mobile-drawer');
    const drawerCloseBtn = document.getElementById('drawer-close-btn');
    const drawerLinks = document.querySelectorAll('.drawer-link');

    const openDrawer = () => {
        drawer.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
        drawer.classList.remove('open');
        document.body.style.overflow = '';
    };

    if (burger) burger.addEventListener('click', openDrawer);
    if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
    drawerLinks.forEach(link => link.addEventListener('click', closeDrawer));


    /* ==========================================
       2. SMOOTH SCROLL FOR NAV LINKS & CARDS
       ========================================== */
    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                closeDrawer();
                
                // Adjust header offset height
                const headerOffset = 90;
                const elementPosition = targetEl.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });


    /* ==========================================
       3. INTERACTIVE SCROLL REVEAL ANIMATIONS
       ========================================== */
    const animElements = document.querySelectorAll('.animate-on-scroll');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        animElements.forEach(el => observer.observe(el));
    } else {
        // Fallback
        animElements.forEach(el => el.classList.add('animated'));
    }


    /* ==========================================
       4. PREMIUM SLIDER (Rubber Crumb Section)
       ========================================== */
    const sliderTrack = document.getElementById('rubber-slider-track');
    const prevBtn = document.getElementById('rubber-slider-prev');
    const nextBtn = document.getElementById('rubber-slider-next');
    const slides = document.querySelectorAll('.slide-item');
    
    let currentSlide = 0;
    const totalSlides = slides.length;

    const updateSlider = () => {
        if (!sliderTrack) return;
        const offset = -currentSlide * 50; // We have 2 slides, each occupies 50% of track (track width 200%)
        sliderTrack.style.transform = `translateX(${offset}%)`;
        
        slides.forEach((slide, idx) => {
            if (idx === currentSlide) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });
    };

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateSlider();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateSlider();
        });
    }

    // Touch Swipe support for Main Slider
    let mainTouchStartX = 0;
    let mainTouchEndX = 0;
    if (sliderTrack) {
        sliderTrack.addEventListener('touchstart', e => {
            mainTouchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        sliderTrack.addEventListener('touchend', e => {
            mainTouchEndX = e.changedTouches[0].screenX;
            const threshold = 50;
            if (mainTouchStartX - mainTouchEndX > threshold) {
                currentSlide = (currentSlide + 1) % totalSlides;
                updateSlider();
            } else if (mainTouchEndX - mainTouchStartX > threshold) {
                currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
                updateSlider();
            }
        }, { passive: true });
    }


    /* ==========================================
       4A. COLOR GAMUT SLIDER
       ========================================== */
    const colorTrack = document.getElementById('color-slider-track');
    const colorPrev = document.getElementById('color-slider-prev');
    const colorNext = document.getElementById('color-slider-next');
    const colorSlides = document.querySelectorAll('.color-slide');
    const colorDots = document.querySelectorAll('.color-dot');
    
    let currentColorSlide = 0;
    const totalColorSlides = colorSlides.length;

    const updateColorSlider = () => {
        if (!colorTrack) return;
        const offset = -currentColorSlide * 100;
        colorTrack.style.transform = `translateX(${offset}%)`;
        
        colorSlides.forEach((slide, idx) => {
            if (idx === currentColorSlide) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        colorDots.forEach((dot, idx) => {
            if (idx === currentColorSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    };

    if (colorNext) {
        colorNext.addEventListener('click', () => {
            currentColorSlide = (currentColorSlide + 1) % totalColorSlides;
            updateColorSlider();
        });
    }

    if (colorPrev) {
        colorPrev.addEventListener('click', () => {
            currentColorSlide = (currentColorSlide - 1 + totalColorSlides) % totalColorSlides;
            updateColorSlider();
        });
    }

    colorDots.forEach(dot => {
        dot.addEventListener('click', function() {
            currentColorSlide = parseInt(this.getAttribute('data-index')) || 0;
            updateColorSlider();
        });
    });

    // Touch Swipe support for Color Slider
    let colorTouchStartX = 0;
    let colorTouchEndX = 0;
    if (colorTrack) {
        colorTrack.addEventListener('touchstart', e => {
            colorTouchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        colorTrack.addEventListener('touchend', e => {
            colorTouchEndX = e.changedTouches[0].screenX;
            const threshold = 50;
            if (colorTouchStartX - colorTouchEndX > threshold) {
                currentColorSlide = (currentColorSlide + 1) % totalColorSlides;
                updateColorSlider();
            } else if (colorTouchEndX - colorTouchStartX > threshold) {
                currentColorSlide = (currentColorSlide - 1 + totalColorSlides) % totalColorSlides;
                updateColorSlider();
            }
        }, { passive: true });
    }


    /* ==========================================
       5. INTERACTIVE RAL PALETTE SELECTOR
       ========================================== */
    const ralDots = document.querySelectorAll('.ral-dot');
    const ralTitle = document.getElementById('ral-color-title');
    const rubberSliderTrack = document.getElementById('rubber-slider-track');
    const crumbTintBox = document.getElementById('crumb-tint-box');

    ralDots.forEach(dot => {
        dot.addEventListener('click', function() {
            ralDots.forEach(d => d.classList.remove('active'));
            this.classList.add('active');

            const ralCode = this.getAttribute('data-ral');
            const ralName = this.getAttribute('data-name');
            const ralHex = this.getAttribute('data-hex');

            if (ralTitle) {
                ralTitle.textContent = `${ralCode} (${ralName})`;
            }

            // High-end aesthetic touch: color overlay/accent shift or border effect on the slider container
            const sliderContainer = document.querySelector('.slider-gallery');
            if (sliderContainer) {
                sliderContainer.style.borderColor = ralHex;
                sliderContainer.style.transition = 'border-color 0.6s ease';
            }

            // Tint the rubber crumb close-up texture
            if (crumbTintBox) {
                crumbTintBox.style.backgroundColor = ralHex;
            }

            // Automatically switch to the 2nd slide (close-up textured crumb) to show the selected color
            if (sliderTrack) {
                currentSlide = 1; // Index 1 is the 2nd slide
                updateSlider();
            }
        });
    });


    /* ==========================================
       6. LEADS DATABASE MANAGER
       ========================================== */
    // Вспомогательная функция для сохранения лидов в localStorage для админ-панели
    const saveLead = (leadType, name, phone, details = '', price = '') => {
        try {
            let leads = [];
            try {
                leads = JSON.parse(localStorage.getItem('alfastroy_leads')) || [];
                if (!Array.isArray(leads)) leads = [];
            } catch (err) {
                leads = [];
            }
            const newLead = {
                id: Date.now(),
                date: new Date().toLocaleString('ru-RU'),
                type: leadType,
                name: name,
                phone: phone,
                details: details,
                price: price
            };
            leads.unshift(newLead);
            localStorage.setItem('alfastroy_leads', JSON.stringify(leads));

            // Отправка в локальный API (если запущен Node-сервер)
            fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLead)
            }).catch(err => {
                console.log('Локальный сервер не запущен, данные сохранены только в localStorage');
            });

            // Отправка в Telegram (если настроено в панели управления)
            const tgToken = localStorage.getItem('alfastroy_tg_token');
            const tgChatId = localStorage.getItem('alfastroy_tg_chat_id');
            if (tgToken && tgChatId) {
                const text = `🔔 *Новая заявка на сайте АльфаСтрой!*\n\n` +
                             `👤 *Имя:* ${name}\n` +
                             `📞 *Телефон:* ${phone}\n` +
                             `📋 *Тип:* ${leadType}\n` +
                             `💬 *Детали:* ${details || '—'}`;
                
                fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: tgChatId,
                        text: text,
                        parse_mode: 'Markdown'
                    })
                }).catch(err => {
                    console.error('Ошибка отправки в Telegram:', err);
                });
            }
        } catch (e) {
            console.error('Ошибка сохранения лида:', e);
        }
    };


    /* ==========================================
       7. SMART PHONE NUMBER MASK FOR INPUTS
       ========================================== */
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let inputVal = this.value.replace(/\D/g, '');
            let formattedVal = '';
            
            if (!inputVal) {
                this.value = '';
                return;
            }
            
            if (['7', '8', '9'].indexOf(inputVal[0]) > -1) {
                // Russian phone format
                if (inputVal[0] === '9') inputVal = '7' + inputVal;
                let firstChar = '+7';
                formattedVal = firstChar + ' ';
                
                if (inputVal.length > 1) {
                    formattedVal += '(' + inputVal.substring(1, 4);
                }
                if (inputVal.length >= 5) {
                    formattedVal += ') ' + inputVal.substring(4, 7);
                }
                if (inputVal.length >= 8) {
                    formattedVal += '-' + inputVal.substring(7, 9);
                }
                if (inputVal.length >= 10) {
                    formattedVal += '-' + inputVal.substring(9, 11);
                }
            } else {
                // Other countries fallback
                formattedVal = '+' + inputVal.substring(0, 15);
            }
            
            this.value = formattedVal;
        });

        input.addEventListener('keydown', function(e) {
            // Clear if backspace is hit on single remaining bracket or code
            const value = this.value;
            if (e.key === 'Backspace' && value.length <= 4) {
                this.value = '';
            }
        });
    });


    /* ==========================================
       8. MODAL MANAGER (Callbacks, Success, Policies)
       ========================================== */
    const modals = document.querySelectorAll('.modal');
    const callbackModal = document.getElementById('callback-modal');
    const privacyModal = document.getElementById('privacy-modal');
    const successModal = document.getElementById('success-modal');
    const successDesc = document.getElementById('success-modal-desc');
    
    const subjectField = document.getElementById('modal-subject-field');
    const modalTitle = document.getElementById('callback-modal-title');
    
    // Close controls
    const closeControls = document.querySelectorAll('.modal-close, .modal-backdrop, #success-done-btn');

    const openModal = (modalElement) => {
        modalElement.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    const closeAllModals = () => {
        modals.forEach(m => m.classList.remove('open'));
        document.body.style.overflow = '';
    };

    // Open General Callback Modal
    document.querySelectorAll('.open-callback-modal').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const subject = this.getAttribute('data-subject') || 'Заявка на консультацию';
            const buttonText = this.textContent.trim();
            
            if (subjectField) subjectField.value = subject;
            if (modalTitle) modalTitle.textContent = buttonText;
            
            openModal(callbackModal);
        });
    });

    // Open Privacy Modal
    document.querySelectorAll('.open-privacy-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            closeAllModals();
            openModal(privacyModal);
        });
    });

    closeControls.forEach(ctrl => {
        ctrl.addEventListener('click', closeAllModals);
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });


    /* ==========================================
       9. FORM VALIDATIONS & SIMULATED SENDING
       ========================================== */
    const phoneRegex = /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;

    const validateField = (input, regex = null, errorEl = null) => {
        let isValid = true;
        const val = input.value.trim();
        
        if (!val) {
            isValid = false;
        } else if (regex && !regex.test(val)) {
            isValid = false;
        }

        if (!isValid) {
            input.classList.add('error');
            if (errorEl) errorEl.style.display = 'block';
        } else {
            input.classList.remove('error');
            if (errorEl) errorEl.style.display = 'none';
        }

        return isValid;
    };

    // Live feedback error removal on type
    const modalName = document.getElementById('modal-name');
    const modalPhone = document.getElementById('modal-phone');
    const modalNameError = document.getElementById('modal-name-error');
    const modalPhoneError = document.getElementById('modal-phone-error');

    if (modalName) modalName.addEventListener('input', () => validateField(modalName, null, modalNameError));
    if (modalPhone) modalPhone.addEventListener('input', () => validateField(modalPhone, phoneRegex, modalPhoneError));

    const closingName = document.getElementById('client-name');
    const closingPhone = document.getElementById('client-phone');
    const closingNameError = document.getElementById('client-name-error');
    const closingPhoneError = document.getElementById('client-phone-error');

    if (closingName) closingName.addEventListener('input', () => validateField(closingName, null, closingNameError));
    if (closingPhone) closingPhone.addEventListener('input', () => validateField(closingPhone, phoneRegex, closingPhoneError));

    const calcNameInput = document.getElementById('calc-name');
    const calcNameError = document.getElementById('calc-name-error');
    const calcPhoneInput = document.getElementById('calc-phone');
    const calcPhoneError = document.getElementById('calc-phone-error');

    if (calcNameInput) calcNameInput.addEventListener('input', () => validateField(calcNameInput, null, calcNameError));
    if (calcPhoneInput) calcPhoneInput.addEventListener('input', () => validateField(calcPhoneInput, phoneRegex, calcPhoneError));


    // SUBMIT 1: Header / Modal callback form
    const callbackForm = document.getElementById('callback-form');
    if (callbackForm) {
        callbackForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const isNameValid = validateField(modalName, null, modalNameError);
            const isPhoneValid = validateField(modalPhone, phoneRegex, modalPhoneError);

            if (isNameValid && isPhoneValid) {
                const submitBtn = this.querySelector('button[type="submit"]');
                const origText = submitBtn.textContent;
                
                submitBtn.textContent = "Обработка запроса...";
                submitBtn.disabled = true;

                setTimeout(() => {
                    closeAllModals();
                    
                    // Сохраняем заявку в админку
                    saveLead("Обратный звонок", modalName.value, modalPhone.value, "Заказ бесплатной консультации из хедера/меню");

                    if (successDesc) {
                        successDesc.textContent = "Благодарим за обращение! Наш специалист свяжется с вами по указанному телефону в течение 10 минут для детального обсуждения вашего проекта.";
                    }
                    
                    openModal(successModal);
                    
                    callbackForm.reset();
                    submitBtn.textContent = origText;
                    submitBtn.disabled = false;
                }, 1000);
            }
        });
    }

    // SUBMIT 2: Calculator Lead Form (Simplified Request Form)
    const calcLeadForm = document.getElementById('calc-lead-form');
    if (calcLeadForm) {
        calcLeadForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const isNameValid = validateField(calcNameInput, null, calcNameError);
            const isPhoneValid = validateField(calcPhoneInput, phoneRegex, calcPhoneError);

            if (isNameValid && isPhoneValid) {
                const submitBtn = document.getElementById('calc-submit-btn');
                const name = calcNameInput.value;
                const phone = calcPhoneInput.value;

                submitBtn.textContent = "Отправка запроса...";
                submitBtn.disabled = true;

                setTimeout(() => {
                    closeAllModals();

                    // Сохраняем заявку в админку
                    saveLead("Запрос расчета", name, phone, "Заявка на расчет стоимости благоустройства с сайта");

                    if (successDesc) {
                        successDesc.innerHTML = `
                            <strong>Заявка на расчет стоимости принята!</strong><br><br>
                            Благодарим за обращение!<br>
                            Наш специалист свяжется с вами на номере <strong>${phone}</strong> в течение 10 минут для уточнения параметров проекта и составления сметы.
                        `;
                    }

                    openModal(successModal);

                    calcLeadForm.reset();
                    submitBtn.textContent = "Рассчитать стоимость";
                    submitBtn.disabled = false;
                }, 1000);
            }
        });
    }

    // SUBMIT 3: Closing Free Measurement Request Form
    const closingForm = document.getElementById('closing-feedback-form');
    if (closingForm) {
        closingForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const isNameValid = validateField(closingName, null, closingNameError);
            const isPhoneValid = validateField(closingPhone, phoneRegex, closingPhoneError);

            if (isNameValid && isPhoneValid) {
                const submitBtn = document.getElementById('closing-submit-btn');
                const origText = submitBtn.textContent;
                
                submitBtn.textContent = "Согласование выезда...";
                submitBtn.disabled = true;

                setTimeout(() => {
                    closeAllModals();

                    // Сохраняем заявку в админку
                    saveLead("Заказ замера", closingName.value, closingPhone.value, "Бесплатный выезд инженера с демонстрационным чемоданом образцов");

                    if (successDesc) {
                        successDesc.innerHTML = `
                            <strong>Заявка на бесплатный замер принята!</strong><br><br>
                            Наш главный инженер приедет к вам с демонстрационным чемоданом образцов.<br><br>
                            Мы свяжемся с вами в течение 10 минут на номере <strong>${closingPhone.value}</strong>, чтобы согласовать точную дату и удобное время выезда на ваш объект.
                        `;
                    }

                    openModal(successModal);

                    closingForm.reset();
                    submitBtn.textContent = origText;
                    submitBtn.disabled = false;
                }, 1200);
            }
        });
    }

    /* ==========================================
       10. MOBILE ACCORDIONS (Tasks & Tile Types)
       ========================================== */
    const isMobile = () => window.innerWidth <= 768;

    // Accordion for Task Cards
    const taskHeaders = document.querySelectorAll('.task-card-item .task-card-header');
    taskHeaders.forEach(header => {
        header.addEventListener('click', () => {
            if (!isMobile()) return;
            const parentCard = header.closest('.task-card-item');
            const wasExpanded = parentCard.classList.contains('expanded');
            
            // Collapse all task cards
            document.querySelectorAll('.task-card-item').forEach(card => {
                card.classList.remove('expanded');
            });

            // Toggle selected card
            if (!wasExpanded) {
                parentCard.classList.add('expanded');
            }
        });
    });

    // Accordion for Tile Type Cards
    const tileHeaders = document.querySelectorAll('.tile-type-card h3');
    tileHeaders.forEach(header => {
        header.addEventListener('click', () => {
            if (!isMobile()) return;
            const parentCard = header.closest('.tile-type-card');
            const wasExpanded = parentCard.classList.contains('expanded');
            
            // Collapse all tile cards
            document.querySelectorAll('.tile-type-card').forEach(card => {
                card.classList.remove('expanded');
            });

            // Toggle selected card
            if (!wasExpanded) {
                parentCard.classList.add('expanded');
            }
        });
    });

    // Automatically expand the first card on load if mobile
    if (isMobile()) {
        const firstTask = document.querySelector('.task-card-item');
        if (firstTask) firstTask.classList.add('expanded');
        
        const firstTile = document.querySelector('.tile-type-card');
        if (firstTile) firstTile.classList.add('expanded');
    }
});

