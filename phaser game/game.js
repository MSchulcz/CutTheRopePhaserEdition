// *** Начальная сцена ***
class StartScene extends Phaser.Scene {
    constructor() {
        super('StartScene');
    }

    preload() {
        // Загрузим изображения
        this.load.image('dog', 'assets/dog.png');
        this.load.image('good_bone', 'assets/good_bone.png');
        this.load.image('bad_bone', 'assets/bad_bone.png');
        this.load.image('background', 'assets/background.png');
        this.load.image('background2', 'assets/background2.png');
        this.load.image('logo', 'assets/logo.png');

        // Загрузим аудиофайлы
        this.load.audio('boneSound', 'assets/bone_collected.mp3');
        this.load.audio('explosion', 'assets/explosion.mp3');
        this.load.audio('button', 'assets/button.mp3');
        this.load.audio('trombon', 'assets/trombon.mp3');
        this.load.audio('music', 'assets/music.mp3');
    }

    create() {
        // Добавляем фоновое изображение
        this.add.image(400, 300, 'background2').setDisplaySize(800, 600); // Разместим и растянем изображение на весь экран
        
        // Добавляем логотип игры
        this.add.image(400, 100, 'logo').setDisplaySize(189, 120); 

        // Проигрываем фоновую музыку в меню
        this.sound.play('music');

        // Заголовок
        this.add.text(400, 200, 'Добро пожаловать в игру!',  {
            fontSize: '32px',
            fill: '#000',
        }).setOrigin(0.5);

        // Инструкции
        this.add.text(400, 300, 'Управляйте Амнямом с помощью стрелок.\nСобирайте пончики и опасайтесь бомбочек!', {
            fontSize: '24px',
            fill: '#000',
            align: 'center'
        }).setOrigin(0.5);

        // Кнопка "Начать"
        const startButton = this.add.text(400, 400, 'Начать игру', {
            fontSize: '28px',
            fill: '#fff',
            backgroundColor: '#28a745',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        startButton.on('pointerdown', () => {
            this.sound.play('button');
            this.scene.start('GameScene'); // Переход к игровой сцене
            this.sound.stopAll();
        });
    }
}

// *** Окно паузы ***
class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create() {
        // Добавляем фоновое изображение
        this.add.image(400, 300, 'background').setDisplaySize(800, 600); // Разместим и растянем изображение на весь экран      

        // Текст паузы
        this.add.text(400, 200, 'Игра на паузе', {
            fontSize: '32px',
            fill: '#000'
        }).setOrigin(0.5);

        // Кнопка "Продолжить"
        const continueButton = this.add.text(400, 300, 'Продолжить', {
            fontSize: '28px',
            fill: '#fff',
            backgroundColor: '#007bff',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        continueButton.on('pointerdown', () => {
            this.sound.play('button');
            this.scene.stop(); // Закрываем окно паузы
            this.scene.resume('GameScene'); // Возобновляем игровую сцену
        });

        // Кнопка "На главную"
        const mainMenuButton = this.add.text(400, 400, 'На главную', {
            fontSize: '28px',
            fill: '#fff',
            backgroundColor: '#dc3545',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        mainMenuButton.on('pointerdown', () => {
            this.sound.play('button');
            this.scene.stop('GameScene'); // Останавливаем игру
            this.scene.start('StartScene'); // Возвращаемся на начальную сцену
        });
    }
}

// *** Игровая сцена ***
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {}

    create() {
        // Добавляем фоновое изображение
        this.add.image(400, 300, 'background').setDisplaySize(800, 600); // Разместим и растянем изображение на весь экран

        // Добавляем "собаку"
        this.dog = this.physics.add.sprite(50, 30, 'dog'); // Создаём собаку с изображением dog.png
        this.dog.setScale(0.5); // Масштабируем изображение, если нужно
        this.resetDogPosition(); // Начальная позиция собаки
        this.physics.add.existing(this.dog, false); // Добавляем физику
        this.dog.body.setCollideWorldBounds(true);

        // Создаем группы для косточек
        this.bones = this.physics.add.group();
        this.badBones = this.physics.add.group();

        // Управление клавишами
        this.cursors = this.input.keyboard.createCursorKeys();

        // Отображение счета
        this.score = 0;
        this.bestScore = localStorage.getItem('bestScore') || 0; // Загружаем лучший счет
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            fill: '#000'
        });

        // Таймеры для генерации косточек
        this.time.addEvent({
            delay: 1000,
            callback: this.dropGoodBone,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 2000,
            callback: this.dropBadBone,
            callbackScope: this,
            loop: true
        });

        // Обработка столкновений
        this.physics.add.overlap(this.dog, this.bones, this.collectBone, null, this);
        this.physics.add.overlap(this.dog, this.badBones, this.hitBadBone, null, this);
    

        // Добавляем кнопки интерфейса
        createInterface(this);
    }

    update() {
        this.dog.body.setVelocityX(0);

        if (this.cursors.left.isDown) {
            this.dog.body.setVelocityX(-300);
        } else if (this.cursors.right.isDown) {
            this.dog.body.setVelocityX(300);
        }
    }

    // Сброс позиции собаки
    resetDogPosition() {
        this.dog.setPosition(400, 550); // Начальная позиция
    }


    // Создание хорошей косточки
    dropGoodBone() {
        let bone = this.bones.create(
            Phaser.Math.Between(50, 750),
            0,
            'good_bone' // Используем изображение good_bone.png
        );
        bone.setScale(0.5); // Масштабируем изображение, если нужно
        bone.setVelocityY(Phaser.Math.Between(150, 250)); // Скорость падения кости
    }

    // Создание плохой косточки
    dropBadBone() {
        let badBone = this.badBones.create(
            Phaser.Math.Between(50, 750),
            0,
            'bad_bone' // Используем изображение bad_bone.png
        );
        badBone.setScale(0.5); // Масштабируем изображение, если нужно
        badBone.setVelocityY(Phaser.Math.Between(150, 250)); // Скорость падения плохой кости
    }

    // Сбор хорошей косточки
    collectBone(dog, bone) {
        bone.destroy();
        this.score += 10; // Увеличиваем счет
        this.scoreText.setText('Score: ' + this.score);
        this.sound.play('boneSound'); // Проигрываем звук сбора косточки
    }

    // Столкновение с плохой косточкой
    hitBadBone(dog, badBone) {
        badBone.destroy();
        this.sound.play('explosion');
        this.sound.play('trombon');

        // Сохраняем лучший счет
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
        }

        // Переход в окно окончания игры
        this.scene.start('GameOverScene', { score: this.score, bestScore: this.bestScore });
    }
}

// Функция для добавления кнопок интерфейса
function createInterface(scene) {
    // Кнопка "Пауза"
    const pauseButton = scene.add.text(600, 16, 'Pause', {
        fontSize: '24px',
        fill: '#fff',
        backgroundColor: '#ffc107',
        padding: { x: 10, y: 5 }
    }).setInteractive();

    pauseButton.on('pointerdown', () => { 
        scene.scene.pause(); // Ставим игру на паузу
        scene.scene.launch('PauseScene'); // Открываем окно паузы
    });

    // Кнопка "Рестарт"
    const restartButton = scene.add.text(600, 50, 'Restart', {
        fontSize: '24px',
        fill: '#fff',
        backgroundColor: '#dc3545',
        padding: { x: 10, y: 5 }
    }).setInteractive();

    restartButton.on('pointerdown', () => {
        scene.score = 0; // Сброс счета
        scene.scoreText.setText('Score: 0');
        scene.resetDogPosition(); // Сбрасываем позицию собаки
        scene.bones.clear(true, true); // Удаляем все косточки
    });
}

// *** Окно окончания игры ***
class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create(data) {
        // Добавляем фоновое изображение
        this.add.image(400, 300, 'background').setDisplaySize(800, 600); // Разместим и растянем изображение на весь экран

        // Сообщение о конце игры
        this.add.text(400, 200, 'Игра окончена!', {
            fontSize: '32px',
            fill: '#000'
        }).setOrigin(0.5);

        // Текущий и лучший счет
        this.add.text(400, 300, `Ваш счет: ${data.score}\nЛучший счет: ${data.bestScore}`, {
            fontSize: '24px',
            fill: '#000',
            align: 'center'
        }).setOrigin(0.5);

        // Кнопка "На главную"
        const mainMenuButton = this.add.text(400, 400, 'На главную', {
            fontSize: '28px',
            fill: '#fff',
            backgroundColor: '#dc3545',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        mainMenuButton.on('pointerdown', () => {
            this.scene.start('StartScene'); // Возвращаемся на начальную сцену
            this.sound.stopAll();
        });

        // Кнопка "Играть снова"
        const playAgainButton = this.add.text(400, 500, 'Играть снова', {
            fontSize: '28px',
            fill: '#fff',
            backgroundColor: '#28a745',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        playAgainButton.on('pointerdown', () => {
            this.sound.stopAll();
            this.scene.start('GameScene'); // Начинаем игру заново
        });
    }
}

// Конфигурация игры
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [StartScene, GameScene, PauseScene, GameOverScene]
};

const game = new Phaser.Game(config);