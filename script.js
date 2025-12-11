document.addEventListener('DOMContentLoaded', function() {
    // ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
    const NOW = new Date();
    const CURRENT_YEAR = NOW.getFullYear();
    const CURRENT_MONTH = NOW.getMonth() + 1; // Январь = 1
    const CURRENT_DAY = NOW.getDate();
    
    const TARGET_YEAR = 2026;
    const TARGET_MONTH = 1; // Январь
    const TARGET_DAY = 1;
    
    // Проверяем, наступил ли уже 2026 год
    const IS_NEW_YEAR = (
        CURRENT_YEAR > TARGET_YEAR || 
        (CURRENT_YEAR === TARGET_YEAR && CURRENT_MONTH >= TARGET_MONTH && CURRENT_DAY >= TARGET_DAY)
    );
    
    // Для тестирования можно установить IS_TEST_MODE = true
    const IS_TEST_MODE = false;
    
    let rewards = JSON.parse(localStorage.getItem('newYear2026Rewards')) || [];
    let openedDays = JSON.parse(localStorage.getItem('opened2026Days')) || [];

    // ========== ОБРАТНЫЙ ОТСЧЁТ ИЛИ ПРИВЕТСТВИЕ ==========
    const countdownEl = document.getElementById('countdown');
    const newYearMessageEl = document.getElementById('newYearMessage');
    
    // Переменные для управления таймером
    let countdownInterval;
    let lastUpdateTime = Date.now();
    
    function updateCountdown() {
        const currentTime = Date.now();
        const elapsed = currentTime - lastUpdateTime;
        
        // Обновляем время только если прошло достаточно времени
        if (elapsed < 10 && !IS_NEW_YEAR) {
            requestAnimationFrame(updateCountdown);
            return;
        }
        
        lastUpdateTime = currentTime;
        
        if (IS_NEW_YEAR) {
            // Новый год наступил
            stopCountdown();
            countdownEl.style.display = 'none';
            newYearMessageEl.style.display = 'block';
            return;
        }
        
        // Вычисляем время до 1 января 2026 года 00:00:00
        const newYear2026 = new Date(TARGET_YEAR, TARGET_MONTH - 1, TARGET_DAY, 0, 0, 0, 0);
        const diff = newYear2026.getTime() - currentTime;
        
        if (diff <= 0) {
            // Если время вышло
            stopCountdown();
            countdownEl.style.display = 'none';
            newYearMessageEl.style.display = 'block';
            localStorage.setItem('newYear2026Arrived', 'true');
            
            // Автоматически открываем все дни
            for (let day = 1; day <= 31; day++) {
                if (!openedDays.includes(day)) {
                    openedDays.push(day);
                    const reward = getRewardForDay(day);
                    rewards.push({ day, reward });
                }
            }
            localStorage.setItem('opened2026Days', JSON.stringify(openedDays));
            localStorage.setItem('newYear2026Rewards', JSON.stringify(rewards));
            updateRewardDisplay();
            updateCalendarDisplay();
            
            return;
        }
        
        const totalSeconds = Math.floor(diff / 1000);
        const days = Math.floor(totalSeconds / (3600 * 24));
        const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor(diff % 1000);
        
        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        document.getElementById('milliseconds').textContent = milliseconds.toString().padStart(3, '0');
        
        // Продолжаем обновление
        if (!IS_NEW_YEAR) {
            requestAnimationFrame(updateCountdown);
        }
    }
    
    function startCountdown() {
        if (!IS_NEW_YEAR) {
            lastUpdateTime = Date.now();
            requestAnimationFrame(updateCountdown);
        }
    }
    
    function stopCountdown() {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
    }
    
    // Запускаем обратный отсчёт
    if (!IS_NEW_YEAR) {
        startCountdown();
    } else {
        countdownEl.style.display = 'none';
        newYearMessageEl.style.display = 'block';
    }

    // ========== СОЗДАНИЕ КАЛЕНДАРЯ ==========
    const calendarEl = document.getElementById('calendar');
    const TOTAL_DAYS = 31;
    
    // Определяем, можно ли открывать дни в зависимости от даты
    function canOpenDay(day) {
        if (IS_TEST_MODE) return true; // Для тестирования
        if (IS_NEW_YEAR) return true; // Если Новый год наступил, все дни открыты
        
        // Текущая дата
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        
        // Можно открывать только если:
        // 1. Текущий месяц - декабрь (12) ИЛИ Новый год уже наступил
        // 2. Номер дня <= текущему дню (нельзя открывать будущие дни)
        // 3. Год <= 2026 (после 2026 все дни открыты)
        
        if (currentYear > 2026) return true;
        if (currentYear === 2026 && currentMonth > 1) return true;
        if (currentYear === 2026 && currentMonth === 1 && currentDay >= 1) return true;
        
        if (currentYear === 2025 && currentMonth === 12) {
            return day <= currentDay;
        }
        
        return false;
    }
    
    function updateCalendarDisplay() {
        calendarEl.innerHTML = '';
        
        for (let day = 1; day <= TOTAL_DAYS; day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'day';
            dayEl.dataset.day = day;
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            
            const dayStatus = document.createElement('div');
            dayStatus.className = 'day-status';
            
            // Проверяем статус дня
            const isOpened = openedDays.includes(day);
            const canOpen = canOpenDay(day);
            const isToday = (CURRENT_MONTH === 12 && CURRENT_DAY === day);
            
            if (isToday) {
                dayEl.classList.add('today');
            }
            
            if (isOpened) {
                dayEl.classList.add('open');
                dayStatus.textContent = 'Открыто!';
                dayEl.addEventListener('click', () => showReward(day));
            } else if (canOpen) {
                dayStatus.textContent = 'Открыть';
                dayEl.addEventListener('click', () => openDay(day));
            } else {
                dayEl.classList.add('locked');
                dayStatus.textContent = 'Заблокировано';
                // Для заблокированных дней не добавляем обработчик клика
            }
            
            dayEl.appendChild(dayNumber);
            dayEl.appendChild(dayStatus);
            calendarEl.appendChild(dayEl);
        }
    }
    
    // Инициализируем календарь
    updateCalendarDisplay();

    // ========== МОДАЛЬНЫЕ ОКНА ==========
    const dayModal = document.getElementById('dayModal');
    const videoModal = document.getElementById('videoModal');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.getElementById('closeModal');
    const closeVideoModal = document.getElementById('closeVideoModal');
    const congratsVideo = document.getElementById('congratsVideo');

    // Закрытие модальных окон
    closeModal.addEventListener('click', () => dayModal.style.display = 'none');
    closeVideoModal.addEventListener('click', () => {
        videoModal.style.display = 'none';
        congratsVideo.pause();
        congratsVideo.currentTime = 0;
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === dayModal) dayModal.style.display = 'none';
        if (e.target === videoModal) {
            videoModal.style.display = 'none';
            congratsVideo.pause();
            congratsVideo.currentTime = 0;
        }
    });

    // ========== ОТКРЫТИЕ ДНЯ ==========
    function openDay(day) {
        if (openedDays.includes(day)) {
            showReward(day);
            return;
        }
        
        // Выбираем активность в зависимости от дня
        let activityHTML = '';
        if (day === 31) {
            activityHTML = getGrandPuzzle();
        } else if (day % 4 === 0) {
            // Графические игры
            activityHTML = getGraphicGame(day);
        } else if (day % 3 === 0) {
            // Старые мини-игры
            activityHTML = getMiniGame(day);
        } else {
            // Загадки
            activityHTML = getRiddle(day);
        }
        
        modalBody.innerHTML = activityHTML;
        dayModal.style.display = 'flex';
        
        // Настраиваем обработчики для игр
        if (day % 4 === 0) {
            setupGraphicGame(day);
        } else if (day % 3 === 0) {
            setupMiniGame(day);
        } else {
            // Для загадок
            const options = modalBody.querySelectorAll('.option-btn');
            options.forEach(btn => {
                btn.addEventListener('click', function() {
                    const isCorrect = this.dataset.correct === 'true';
                    handleAnswer(isCorrect, day);
                });
            });
        }
    }

    // ========== ОБРАБОТКА ОТВЕТА ==========
    function handleAnswer(isCorrect, day) {
        if (isCorrect) {
            // Показываем поздравление и затем видео
            modalBody.innerHTML = `
                <div class="congrats">
                    <i class="fas fa-trophy" style="font-size: 4rem; color: #FFD700;"></i>
                    <h2>Поздравляем!</h2>
                    <p>Вы успешно решили головоломку ${day} декабря!</p>
                    <p>Ваша награда: <strong>${getRewardForDay(day)}</strong></p>
                    <div class="game-controls">
                        <button class="game-btn" id="showVideoBtn">Посмотреть поздравление</button>
                        <button class="game-btn secondary" id="claimRewardBtn">Забрать награду</button>
                    </div>
                </div>
            `;
            
            document.getElementById('showVideoBtn').addEventListener('click', () => {
                dayModal.style.display = 'none';
                videoModal.style.display = 'flex';
                congratsVideo.currentTime = 0;
                congratsVideo.play().catch(e => console.log("Автовоспроизведение заблокировано:", e));
            });
            
            document.getElementById('claimRewardBtn').addEventListener('click', () => claimReward(day));
        } else {
            modalBody.innerHTML = `
                <div style="text-align: center;">
                    <i class="fas fa-times-circle" style="font-size: 4rem; color: #ff4444;"></i>
                    <h2>Попробуйте ещё раз!</h2>
                    <p>Ответ неверный. Попробуйте снова.</p>
                    <button class="game-btn" onclick="location.reload()">Закрыть</button>
                </div>
            `;
        }
    }

    // ========== ПОЛУЧЕНИЕ НАГРАДЫ ==========
    function claimReward(day) {
        if (!openedDays.includes(day)) {
            openedDays.push(day);
            const reward = getRewardForDay(day);
            rewards.push({ day, reward });
            
            localStorage.setItem('opened2026Days', JSON.stringify(openedDays));
            localStorage.setItem('newYear2026Rewards', JSON.stringify(rewards));
            
            updateRewardDisplay();
            updateCalendarDisplay();
            showReward(day);
        }
    }

    function showReward(day) {
        const reward = rewards.find(r => r.day === day);
        modalBody.innerHTML = `
            <div style="text-align: center;">
                <i class="fas fa-gift" style="font-size: 4rem; color: #FFD700;"></i>
                <h2>День ${day} декабря</h2>
                <p>Ваша награда: <strong>${reward ? reward.reward : 'Не найдена'}</strong></p>
                <p style="color: #ffcc99; margin-top: 20px;">${getRewardDescription(day)}</p>
                <button class="game-btn" id="closeRewardBtn">Закрыть</button>
            </div>
        `;
        document.getElementById('closeRewardBtn').addEventListener('click', () => {
            dayModal.style.display = 'none';
        });
        dayModal.style.display = 'flex';
    }

    // ========== БАЗА ДАННЫХ АКТИВНОСТЕЙ ==========
    // 1. ЗАГАДКИ
    function getRiddle(day) {
        const riddles = [
            { q: "С неба падает зимой, но не дождь и не снежинка. Что это?", opts: ["Иней", "Град", "Пух", "Звезда"], a: 1 },
            { q: "Красный нос, борода, мешок за спиной. Кто он в Новый год?", opts: ["Гном", "Снеговик", "Дед Мороз", "Почтальон"], a: 2 },
            { q: "На ёлке висят, но не листья. Что это?", opts: ["Шишки", "Игрушки", "Свечи", "Конфеты"], a: 1 },
            { q: "Бежит без ног, греет без огня. Что это?", opts: ["Время", "Река", "Поезд", "Новый год"], a: 0 },
            { q: "2026 год - год какого животного по восточному календарю?", opts: ["Кролика", "Дракона", "Лошади", "Змеи"], a: 2 },
            { q: "Что бьёт ровно 12 раз в новогоднюю ночь?", opts: ["Сердце", "Куранты", "Молоток", "Дверь"], a: 1 },
            { q: "Летит, а не птица, воет, а не зверь. Что это?", opts: ["Самолёт", "Ветер", "Время", "Снег"], a: 1 }
        ];
        const riddle = riddles[(day - 1) % riddles.length];
        let optsHTML = '';
        riddle.opts.forEach((opt, idx) => {
            optsHTML += `<button class="option-btn" data-correct="${idx === riddle.a}">${opt}</button>`;
        });
        return `
            <h2 class="game-title">Загадка дня ${day}</h2>
            <p class="puzzle-question">${riddle.q}</p>
            <div class="puzzle-options">${optsHTML}</div>
        `;
    }

    // 2. СТАРЫЕ МИНИ-ИГРЫ (сохранены)
    function getMiniGame(day) {
        const games = [
            `<div class="game-container">
                <h3 class="game-title">Угадай цвет!</h3>
                <div id="colorGuess" style="width: 100px; height: 100px; margin: 20px auto; border-radius: 10px; border: 3px solid white; background-color: rgb(255, 68, 68);"></div>
                <p>Введите цвет в формате RGB:</p>
                <input type="text" id="colorInput" placeholder="Например: 255, 68, 68">
                <div class="game-controls">
                    <button class="game-btn" id="checkColorBtn">Проверить</button>
                </div>
                <p id="colorResult"></p>
            </div>`,
            `<div class="game-container">
                <h3 class="game-title">Собери слово!</h3>
                <p>Переставь буквы: <strong id="scrambledWord">ЛШАОД</strong></p>
                <p>Подсказка: символ 2026 года</p>
                <input type="text" id="unscrambleInput" placeholder="Ваш вариант">
                <div class="game-controls">
                    <button class="game-btn" id="checkWordBtn">Проверить</button>
                </div>
                <p id="wordResult"></p>
            </div>`
        ];
        return games[(day - 1) % games.length];
    }

    function setupMiniGame(day) {
        // Цветовая игра
        if (document.getElementById('checkColorBtn')) {
            document.getElementById('checkColorBtn').addEventListener('click', function() {
                const input = document.getElementById('colorInput').value.trim();
                const resultEl = document.getElementById('colorResult');
                if (input === "255, 68, 68" || input === "255,68,68") {
                    resultEl.innerHTML = '<span style="color: #4CAF50;">Правильно! Это красный цвет лошади!</span>';
                    setTimeout(() => handleAnswer(true, day), 1500);
                } else {
                    resultEl.innerHTML = '<span style="color: #ff4444;">Неверно. Попробуйте ещё!</span>';
                }
            });
        }
        
        // Игра с буквами
        if (document.getElementById('checkWordBtn')) {
            document.getElementById('checkWordBtn').addEventListener('click', function() {
                const input = document.getElementById('unscrambleInput').value.trim().toUpperCase();
                const resultEl = document.getElementById('wordResult');
                if (input === "ЛОШАДЬ") {
                    resultEl.innerHTML = '<span style="color: #4CAF50;">Верно! 2026 - год Лошади!</span>';
                    setTimeout(() => handleAnswer(true, day), 1500);
                } else {
                    resultEl.innerHTML = '<span style="color: #ff4444;">Неправильно. Попробуйте снова!</span>';
                }
            });
        }
    }

    // 3. НОВЫЕ ГРАФИЧЕСКИЕ ИГРЫ
    function getGraphicGame(day) {
        const games = [
            `<div class="game-container">
                <h3 class="game-title">Собери символ лошади!</h3>
                <p>Перетащите части в правильном порядке:</p>
                <div class="horse-puzzle">
                    <div class="puzzle-grid" id="puzzleGrid">
                        <div class="puzzle-piece" data-order="3">🐴</div>
                        <div class="puzzle-piece" data-order="1">🔥</div>
                        <div class="puzzle-piece" data-order="4">🎁</div>
                        <div class="puzzle-piece" data-order="2">🌟</div>
                        <div class="puzzle-piece" data-order="6">🎄</div>
                        <div class="puzzle-piece" data-order="5">⭐</div>
                    </div>
                </div>
                <p>Порядок: Огонь → Звезда → Лошадь → Подарок → Звездочка → Ёлка</p>
                <div class="game-controls">
                    <button class="game-btn" id="checkPuzzleBtn">Проверить порядок</button>
                    <button class="game-btn secondary" id="shufflePuzzleBtn">Перемешать</button>
                </div>
                <p id="puzzleResult"></p>
            </div>`,
            `<div class="game-container">
                <h3 class="game-title">Найди все подарки!</h3>
                <p>Найдите 5 скрытых подарков на картинке:</p>
                <div class="find-gifts-game" id="giftGame">
                    <!-- Подарки добавляются через JS -->
                </div>
                <p>Найдено: <span id="giftsFound">0</span> из 5</p>
                <div class="game-controls">
                    <button class="game-btn" id="checkGiftsBtn">Проверить</button>
                </div>
            </div>`,
            `<div class="game-container">
                <h3 class="game-title">Поймай снежинки!</h3>
                <p>Кликните на 10 снежинок за 10 секунд:</p>
                <div class="snowflake-game" id="snowflakeGame">
                    <div class="snowflake-target">🎯</div>
                    <!-- Снежинки добавляются через JS -->
                </div>
                <p>Счёт: <span id="snowflakeScore">0</span> | Время: <span id="snowflakeTime">10</span>с</p>
                <div class="game-controls">
                    <button class="game-btn" id="startSnowflakeBtn">Начать игру</button>
                </div>
            </div>`
        ];
        return games[(day - 1) % games.length];
    }

    function setupGraphicGame(day) {
        // Игра с пазлом
        if (document.getElementById('checkPuzzleBtn')) {
            const pieces = document.querySelectorAll('.puzzle-piece');
            pieces.forEach(piece => {
                piece.addEventListener('click', function() {
                    this.classList.toggle('selected');
                });
            });
            
            document.getElementById('shufflePuzzleBtn').addEventListener('click', function() {
                const grid = document.getElementById('puzzleGrid');
                const piecesArray = Array.from(grid.children);
                piecesArray.sort(() => Math.random() - 0.5);
                piecesArray.forEach(piece => grid.appendChild(piece));
            });
            
            document.getElementById('checkPuzzleBtn').addEventListener('click', function() {
                const pieces = document.querySelectorAll('.puzzle-piece');
                let isCorrect = true;
                pieces.forEach((piece, index) => {
                    const correctOrder = index + 1;
                    const pieceOrder = parseInt(piece.dataset.order);
                    if (pieceOrder === correctOrder) {
                        piece.classList.add('correct');
                        piece.classList.remove('incorrect');
                    } else {
                        piece.classList.add('incorrect');
                        piece.classList.remove('correct');
                        isCorrect = false;
                    }
                });
                
                const resultEl = document.getElementById('puzzleResult');
                if (isCorrect) {
                    resultEl.innerHTML = '<span style="color: #4CAF50;">Превосходно! Пазл собран верно!</span>';
                    setTimeout(() => handleAnswer(true, day), 2000);
                } else {
                    resultEl.innerHTML = '<span style="color: #ff4444;">Порядок неверный. Попробуйте ещё!</span>';
                }
            });
        }
        
        // Игра с поиском подарков
        if (document.getElementById('giftGame')) {
            const gameArea = document.getElementById('giftGame');
            let giftsFound = 0;
            
            // Создаем 5 подарков в случайных местах
            for (let i = 0; i < 5; i++) {
                const gift = document.createElement('div');
                gift.className = 'gift';
                gift.innerHTML = '🎁';
                gift.style.left = `${10 + Math.random() * 80}%`;
                gift.style.top = `${10 + Math.random() * 80}%`;
                
                gift.addEventListener('click', function() {
                    if (!this.classList.contains('found')) {
                        this.classList.add('found');
                        giftsFound++;
                        document.getElementById('giftsFound').textContent = giftsFound;
                        this.innerHTML = '✓';
                    }
                });
                
                gameArea.appendChild(gift);
            }
            
            document.getElementById('checkGiftsBtn').addEventListener('click', function() {
                if (giftsFound >= 5) {
                    handleAnswer(true, day);
                } else {
                    document.getElementById('puzzleResult').innerHTML = 
                        '<span style="color: #ff4444;">Найдите все 5 подарков!</span>';
                }
            });
        }
        
        // Игра со снежинками
        if (document.getElementById('startSnowflakeBtn')) {
            let score = 0;
            let timeLeft = 10;
            let gameInterval;
            
            document.getElementById('startSnowflakeBtn').addEventListener('click', function() {
                score = 0;
                timeLeft = 10;
                document.getElementById('snowflakeScore').textContent = score;
                document.getElementById('snowflakeTime').textContent = timeLeft;
                this.disabled = true;
                
                // Создаем снежинки
                const gameArea = document.getElementById('snowflakeGame');
                gameArea.innerHTML = '<div class="snowflake-target">🎯</div>';
                
                for (let i = 0; i < 15; i++) {
                    const snowflake = document.createElement('div');
                    snowflake.className = 'click-snowflake';
                    snowflake.innerHTML = '❄';
                    snowflake.style.left = `${5 + Math.random() * 90}%`;
                    snowflake.style.top = `${5 + Math.random() * 90}%`;
                    
                    snowflake.addEventListener('click', function() {
                        if (timeLeft > 0) {
                            score++;
                            document.getElementById('snowflakeScore').textContent = score;
                            this.style.display = 'none';
                        }
                    });
                    
                    gameArea.appendChild(snowflake);
                }
                
                // Таймер
                gameInterval = setInterval(() => {
                    timeLeft--;
                    document.getElementById('snowflakeTime').textContent = timeLeft;
                    
                    if (timeLeft <= 0) {
                        clearInterval(gameInterval);
                        document.getElementById('startSnowflakeBtn').disabled = false;
                        
                        if (score >= 10) {
                            setTimeout(() => handleAnswer(true, day), 1000);
                        } else {
                            document.getElementById('puzzleResult').innerHTML = 
                                `<span style="color: #ff4444;">Игра окончена! Вы набрали ${score} очков. Нужно 10!</span>`;
                        }
                    }
                }, 1000);
            });
        }
    }

    // 4. ГРАНДИОЗНАЯ ГОЛОВОЛОМКА 31 ДЕКАБРЯ
    function getGrandPuzzle() {
        return `
            <div style="text-align: center;">
                <i class="fas fa-crown" style="font-size: 5rem; color: #FFD700;"></i>
                <h2 class="game-title">ГРАНДИОЗНАЯ ГОЛОВОЛОМКА 31 ДЕКАБРЯ!</h2>
                <p>Финальный вопрос для особой награды:</p>
                <p><strong>Какого цвета будет Огненная Лошадь 2026 года по восточному календарю?</strong></p>
                <div class="puzzle-options">
                    <button class="option-btn" data-correct="false">Синего</button>
                    <button class="option-btn" data-correct="true">Красного</button>
                    <button class="option-btn" data-correct="false">Зелёного</button>
                    <button class="option-btn" data-correct="false">Жёлтого</button>
                </div>
                <p style="margin-top: 30px; font-size: 1rem; color: #FFD700;">2026 - Год Красной Огненной Лошади!</p>
            </div>
        `;
    }

    // ========== СИСТЕМА НАГРАД ==========
    function getRewardForDay(day) {
        const rewardsList = [
            "Виртуальный снежок", "Ёлочная игрушка-лошадка", "Поздравление от Деда Мороза",
            "Горячий шоколад", "Новогодний стикерпак", "Мандаринка удачи",
            "Зимняя мелодия", "Сияющая гирлянда", "Волшебный хлопушка",
            "Блестящий конфетти", "Тёплые носочки", "Звезда желаний",
            "Серебряный колокольчик", "Пряничная лошадка", "Ледяной кристалл",
            "Снежинка-талисман", "Аромат ёлки", "Благодарственное письмо",
            "Золотой орешек", "Шампанское успеха", "Фейерверк эмоций",
            "Плед уюта", "Книга зимних сказок", "Волшебный посох",
            "Мешок подарков", "Северное сияние", "Снеговик-охранник",
            "Ледяной дворец", "Песня снегиря", "Мантия праздника",
            "ОСОБАЯ НАГРАДА: КЛЮЧ ОТ 2026 ГОДА И ЗОЛОТАЯ ЛОШАДЬ УДАЧИ!"
        ];
        return rewardsList[day - 1] || "Сюрприз от Красной Огненной Лошади!";
    }

    function getRewardDescription(day) {
        const descriptions = [
            "Эта награда принесёт вам удачу в новом году!",
            "Лошадь - символ 2026 года, храните эту награду!",
            "Пусть этот подарок согреет вас зимними вечерами!",
            "С этой наградой весь год будет сладким!",
            "Наклейки с символом года для ваших устройств!",
            "Мандарин - традиционный новогодний фрукт!",
            "Зимняя мелодия будет звучать в вашем сердце!",
            "Пусть гирлянда освещает ваш путь к успеху!",
            "Хлопушка с конфетти для праздничного настроения!",
            "Конфетти удачи осыпет вас в новом году!",
            "Тёплые носочки согреют в любые морозы!",
            "Загадайте желание - звезда его исполнит!",
            "Колокольчик будет звенеть в моменты радости!",
            "Пряничная лошадка - сладкий символ года!",
            "Кристалл сохранит ваши лучшие моменты!",
            "Эта снежинка станет вашим талисманом!",
            "Аромат новогодней ёлки круглый год!",
            "Письмо с благодарностью за ваши добрые дела!",
            "Золотой орешек мудрости для важных решений!",
            "Шампанское для праздничных достижений!",
            "Фейерверк ярких эмоций в новом году!",
            "Плед уюта для семейных вечеров!",
            "Сказки, которые перенесут в мир чудес!",
            "Посох поможет осуществить мечты!",
            "Мешок, который всегда полон сюрпризов!",
            "Северное сияние украсит вашу жизнь!",
            "Снеговик будет охранять ваш покой!",
            "Дворец из льда для королевских приёмов!",
            "Песня, которая поднимет настроение!",
            "Мантия для королевского новогоднего бала!",
            "КЛЮЧ ОТ НОВОГО 2026 ГОДА! Красная Огненная Лошадь будет вашим проводником к успеху!"
        ];
        return descriptions[day - 1] || "Эта награда принесёт вам удачу!";
    }

    // ========== ОБНОВЛЕНИЕ ОТОБРАЖЕНИЯ НАГРАД ==========
    function updateRewardDisplay() {
        const rewardListEl = document.getElementById('rewardList');
        if (rewards.length === 0) {
            rewardListEl.innerHTML = '<p>Открывайте дни, чтобы собрать все награды от Красной Огненной Лошади!</p>';
            return;
        }

        rewardListEl.innerHTML = rewards.map(r => `
            <div class="reward-item">
                <i class="fas fa-gift"></i> 
                <strong>${r.day} дек:</strong> ${r.reward}
            </div>
        `).join('');
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    updateRewardDisplay();
    
    // Автоматическое обновление при наступлении Нового года
    setInterval(() => {
        const now = new Date();
        if (now.getFullYear() >= 2026 && now.getMonth() === 0 && now.getDate() >= 1) {
            if (!IS_NEW_YEAR) {
                location.reload(); // Перезагружаем страницу при наступлении Нового года
            }
        }
    }, 60000); // Проверяем каждую минуту
    
    // Для тестирования: консольная команда
    window.testNewYear = function() {
        localStorage.setItem('newYear2026Arrived', 'true');
        location.reload();
    };
});
