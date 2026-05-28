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


    /* ==========================================
       5. INTERACTIVE RAL PALETTE SELECTOR
       ========================================== */
    const ralDots = document.querySelectorAll('.ral-dot');
    const ralTitle = document.getElementById('ral-color-title');
    const rubberSliderTrack = document.getElementById('rubber-slider-track');

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
        });
    });


    /* ==========================================
       6. INTERACTIVE CALCULATOR (Step-by-Step Sync)
       ========================================== */
    const areaRange = document.getElementById('calc-area-range');
    const areaNum = document.getElementById('calc-area-num');
    const coatingRadios = document.querySelectorAll('input[name="calc_coating"]');
    const chkBorder = document.getElementById('calc-need-border');
    const chkDrain = document.getElementById('calc-need-drain');
    const chkBase = document.getElementById('calc-need-base');
    const blurredPrice = document.getElementById('calc-blurred-price');

    // Вспомогательная функция для сохранения лидов в localStorage для админ-панели
    const saveLead = (leadType, name, phone, details = '', price = '') => {
        try {
            let leads = [];
            try {
                leads = JSON.parse(localStorage.getItem('kamen_hvoya_leads')) || [];
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
            localStorage.setItem('kamen_hvoya_leads', JSON.stringify(leads));
        } catch (e) {
            console.error('Ошибка сохранения лида:', e);
        }
    };

    // Динамическая загрузка тарифов из localStorage с дефолтными значениями
    const getPricingConfig = () => {
        const defaults = {
            stone_carpet: 4500,
            rubber_crumb: 1800,
            paving_stones: 2400,
            border: 600,
            drain: 950,
            base: 1200
        };
        const saved = localStorage.getItem('kamen_hvoya_pricing');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch(e) {
                return defaults;
            }
        }
        localStorage.setItem('kamen_hvoya_pricing', JSON.stringify(defaults));
        return defaults;
    };

    const config = getPricingConfig();

    const pricing = {
        coatings: {
            stone_carpet: config.stone_carpet,
            rubber_crumb: config.rubber_crumb,
            paving_stones: config.paving_stones
        },
        services: {
            border_per_meter: config.border,
            drainage_per_meter: config.drain,
            base_prep_per_sqm: config.base
        }
    };

    // Динамическое обновление подписей цен на самом лендинге под калькулятор
    const updatePricingLabels = () => {
        const stoneCarpetLbl = document.getElementById('label-price-stone_carpet');
        const rubberCrumbLbl = document.getElementById('label-price-rubber_crumb');
        const pavingStonesLbl = document.getElementById('label-price-paving_stones');
        const borderLbl = document.getElementById('label-price-border');
        const drainLbl = document.getElementById('label-price-drain');
        const baseLbl = document.getElementById('label-price-base');

        if (stoneCarpetLbl) stoneCarpetLbl.textContent = `от ${pricing.coatings.stone_carpet.toLocaleString('ru-RU')} ₽/м²`;
        if (rubberCrumbLbl) rubberCrumbLbl.textContent = `от ${pricing.coatings.rubber_crumb.toLocaleString('ru-RU')} ₽/м²`;
        if (pavingStonesLbl) pavingStonesLbl.textContent = `от ${pricing.coatings.paving_stones.toLocaleString('ru-RU')} ₽/м²`;
        if (borderLbl) borderLbl.textContent = `Установка скрытых бордюров (+${pricing.services.border_per_meter.toLocaleString('ru-RU')} ₽/м)`;
        if (drainLbl) drainLbl.textContent = `Устройство ливневого дренажа (+${pricing.services.drainage_per_meter.toLocaleString('ru-RU')} ₽/м)`;
        if (baseLbl) baseLbl.textContent = `Подготовка бетонного/щебеночного основания (+${pricing.services.base_prep_per_sqm.toLocaleString('ru-RU')} ₽/м²)`;
    };

    updatePricingLabels();

    const calculateCost = () => {
        if (!blurredPrice) return;

        // 1. Get current values
        const area = parseFloat(areaNum.value) || 0;
        let selectedCoating = 'stone_carpet';
        
        coatingRadios.forEach(radio => {
            if (radio.checked) selectedCoating = radio.value;
        });

        const needBorder = chkBorder ? chkBorder.checked : false;
        const needDrain = chkDrain ? chkDrain.checked : false;
        const needBase = chkBase ? chkBase.checked : false;

        // 2. Base coating cost
        const coatingPricePerSqm = pricing.coatings[selectedCoating];
        let total = coatingPricePerSqm * area;

        // 3. Add borders (perimeter ≈ 4 * sqrt(area))
        if (needBorder) {
            const perimeter = Math.round(4 * Math.sqrt(area));
            total += pricing.services.border_per_meter * perimeter;
        }

        // 4. Add drainage (assume drainage length ≈ 1.5 * sqrt(area))
        if (needDrain) {
            const drainageLength = Math.round(1.5 * Math.sqrt(area));
            total += pricing.services.drainage_per_meter * drainageLength;
        }

        // 5. Add base preparation (per m²)
        if (needBase) {
            total += pricing.services.base_prep_per_sqm * area;
        }

        // 6. Update visual price (with formatted space thousands separator)
        const formattedTotal = Math.round(total).toLocaleString('ru-RU');
        blurredPrice.textContent = `от ${formattedTotal} ₽`;
    };

    // Sync input range and input number
    if (areaRange && areaNum) {
        areaRange.addEventListener('input', function() {
            areaNum.value = this.value;
            calculateCost();
        });

        areaNum.addEventListener('input', function() {
            let val = parseFloat(this.value);
            if (isNaN(val)) val = 10;
            if (val < 10) val = 10;
            if (val > 1000) val = 1000;
            
            areaRange.value = val;
            calculateCost();
        });

        areaNum.addEventListener('blur', function() {
            if (!this.value.trim() || parseFloat(this.value) < 10) {
                this.value = 10;
                areaRange.value = 10;
                calculateCost();
            }
        });
    }

    // Add change triggers to all inputs
    coatingRadios.forEach(radio => radio.addEventListener('change', calculateCost));
    [chkBorder, chkDrain, chkBase].forEach(chk => {
        if (chk) chk.addEventListener('change', calculateCost);
    });

    // Initial calculation
    calculateCost();


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

    const calcPhoneInput = document.getElementById('calc-phone');
    const calcPhoneError = document.getElementById('calc-phone-error');

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
                    saveLead("Обратный звонок", modalName.value, modalPhone.value, "Заказ обратного звонка из формы хедера/кнопки");

                    if (successDesc) {
                        successDesc.textContent = "Благодарим за обращение! Наш ведущий специалист свяжется с вами по указанному телефону в течение 10 минут для детального обсуждения вашего проекта.";
                    }
                    
                    openModal(successModal);
                    
                    callbackForm.reset();
                    submitBtn.textContent = origText;
                    submitBtn.disabled = false;
                }, 1000);
            }
        });
    }

    // SUBMIT 2: Calculator Lead Form (WhatsApp)
    const calcLeadForm = document.getElementById('calc-lead-form');
    if (calcLeadForm) {
        calcLeadForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const isPhoneValid = validateField(calcPhoneInput, phoneRegex, calcPhoneError);

            if (isPhoneValid) {
                const submitBtn = document.getElementById('calc-submit-btn');
                const area = areaNum.value;
                
                let selectedCoatingName = 'Каменный ковер';
                coatingRadios.forEach(radio => {
                    if (radio.checked) {
                        if (radio.value === 'rubber_crumb') selectedCoatingName = 'Резиновая крошка';
                        if (radio.value === 'paving_stones') selectedCoatingName = 'Укладка брусчатки';
                    }
                });

                const needBorder = chkBorder ? chkBorder.checked : false;
                const needDrain = chkDrain ? chkDrain.checked : false;
                const needBase = chkBase ? chkBase.checked : false;

                const phone = calcPhoneInput.value;
                const priceText = blurredPrice.textContent;

                submitBtn.textContent = "Отправка в WhatsApp...";
                submitBtn.disabled = true;

                // Reveal price on successful submission!
                if (blurredPrice) {
                    blurredPrice.style.filter = 'none';
                    blurredPrice.style.webkitFilter = 'none';
                }

                setTimeout(() => {
                    closeAllModals();

                    // Сохраняем заявку в админку
                    const details = `Покрытие: ${selectedCoatingName}, Площадь: ${area} м², Доп. услуги: ${[needBorder ? 'бордюры' : '', needDrain ? 'дренаж' : '', needBase ? 'основание' : ''].filter(Boolean).join(', ') || 'нет'}`;
                    saveLead("Калькулятор стоимости", "Заявка из квиза", phone, details, priceText);

                    if (successDesc) {
                        successDesc.innerHTML = `
                            Ваш проект успешно сформирован!<br><br>
                            <strong>Параметры расчета:</strong><br>
                            • Покрытие: ${selectedCoatingName}<br>
                            • Площадь: ${area} м²<br>
                            • Доп. услуги: ${[needBorder ? 'бордюры' : '', needDrain ? 'дренаж' : '', needBase ? 'основание' : ''].filter(Boolean).join(', ') || 'нет'}<br>
                            • Итог: <strong>${priceText}</strong><br><br>
                            Детальная смета по материалам и доставке отправлена на номер <strong>${phone}</strong> в WhatsApp. Наш специалист уже готовит КП.
                        `;
                    }

                    openModal(successModal);
                    
                    // Open WhatsApp transition link in new window for real premium lead flow!
                    const textMsg = `Здравствуйте! Я рассчитал проект на сайте KAMEN & HVOYA. Покрытие: ${selectedCoatingName}, Площадь: ${area} м², Стоимость: ${priceText}. Отправьте мне подробную смету.`;
                    const waUrl = `https://wa.me/73412998877?text=${encodeURIComponent(textMsg)}`;
                    window.open(waUrl, '_blank');

                    calcLeadForm.reset();
                    submitBtn.textContent = "Получить точную смету в WhatsApp";
                    submitBtn.disabled = false;
                    
                    // Reset price blurring after reset
                    setTimeout(() => {
                        if (blurredPrice) {
                            blurredPrice.style.filter = '';
                            blurredPrice.style.webkitFilter = '';
                        }
                        calculateCost();
                    }, 5000);

                }, 1200);
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
});
