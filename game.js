import Phaser from 'phaser';

class EasterGame extends Phaser.Scene {
    constructor() {
        super('EasterGame');
        this.moveDelay = 200;
        this.lastMoveTime = 0;
        this.tileSize = 32;
        this.maxChicks = 5;
        this.lastDirection = 'down';
        this.legendarySpawned = false;
    }

    preload() {
        this.load.image('background', '/assets/backyard.png');
        this.load.tilemapTiledJSON('map', '/assets/backyard.tmj');
        this.load.image('tiles', '/assets/backyard.png');
        this.load.spritesheet('player_walk_down', '/assets/FrontPlayerWalk.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('player_walk_right', '/assets/RightPlayerWalk.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('player_walk_left', '/assets/LeftPlayerWalk.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('player_walk_up', '/assets/BackPlayerWalk.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('pipichick', '/assets/pipichick.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('projectile', '/assets/easteregg3.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('legendary', '/assets/Legendary.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('firework', 'assets/pinkFW.png', { frameWidth: 128, frameHeight: 128 });
    }

    create() {
        const bg = this.add.image(0, 0, 'background').setOrigin(0, 0);
        this.physics.world.setBounds(32, 32, bg.width - 64, bg.height - 64);

        // Firework anims
        this.anims.create({ key: 'firework_rise', frames: this.anims.generateFrameNumbers('firework', { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'firework_burst', frames: this.anims.generateFrameNumbers('firework', { start: 6, end: 13 }), frameRate: 10, repeat: 0 });
        // Player setup
        this.anims.create({ key: 'walk_down', frames: this.anims.generateFrameNumbers('player_walk_down', { start: 0, end: 3 }), frameRate: 4, repeat: -1 });
        this.anims.create({ key: 'walk_up', frames: this.anims.generateFrameNumbers('player_walk_up', { start: 0, end: 3 }), frameRate: 4, repeat: -1 });
        this.anims.create({ key: 'walk_left', frames: this.anims.generateFrameNumbers('player_walk_left', { start: 0, end: 3 }), frameRate: 4, repeat: -1 });
        this.anims.create({ key: 'walk_right', frames: this.anims.generateFrameNumbers('player_walk_right', { start: 0, end: 3 }), frameRate: 4, repeat: -1 });

        this.anims.create({ key: 'projectile_toss', frames: this.anims.generateFrameNumbers('projectile', { start: 0, end: 7 }), frameRate: 10, repeat: 0 });
        this.anims.create({ key: 'projectile_hit', frames: this.anims.generateFrameNumbers('projectile', { start: 8, end: 16 }), frameRate: 10, repeat: 0 });

        this.anims.create({ key: 'legendary_appear', frames: this.anims.generateFrameNumbers('legendary', { start: 0, end: 8 }), frameRate: 5, repeat: -1 });
        this.textures.get('firework').setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.textures.get('projectile').setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.player = this.physics.add.sprite(50, 50, 'player_walk_down');
        this.player.setCollideWorldBounds(true);
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            shoot: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        this.projectiles = this.physics.add.group();

        // Pipichick setup
        this.anims.create({
            key: 'pipichick_idle',
            frames: this.anims.generateFrameNumbers('pipichick', { start: 0, end: 1 }),
            frameRate: 4,
            repeat: -1
        });

        this.pipichicks = this.physics.add.group();
        this.pipichickPositions = [];

        for (let i = 0; i < this.maxChicks; i++) {
            const x = Phaser.Math.Between(64, this.scale.width - 64);
            const y = Phaser.Math.Between(64, this.scale.height - 64);
            const chick = this.pipichicks.create(x, y, 'pipichick');
            chick.play('pipichick_idle');
            chick.setCollideWorldBounds(true);
            chick.setBounce(1);
            chick.setVelocity(Phaser.Math.Between(-32, 32), Phaser.Math.Between(-32, 32));
            chick.nextMoveTime = 0;
        }

        this.physics.add.collider(this.pipichicks, this.pipichicks);
        this.physics.add.collider(this.pipichicks, this.player);
        this.physics.add.overlap(this.projectiles, this.pipichicks, this.hitPipichick, null, this);
    }
    launchFirework(x, y) {
        const firework = this.add.sprite(x, y, 'firework');
        firework.setDepth(Phaser.Math.Between(0, 1));
        firework.setScale(4);
        firework.play('firework_rise');

        this.tweens.add({
            targets: firework,
            y: y - 64,
            duration: 800,
            ease: 'Sine.easeOut',
            onComplete: () => {
                firework.play('firework_burst');
                firework.once('animationcomplete', () => firework.destroy());
            }
        });
    }
    shootProjectile() {
        const projectile = this.projectiles.create(this.player.x, this.player.y, 'projectile');
        projectile.play('projectile_toss');

        let velocity = new Phaser.Math.Vector2();
        switch (this.lastDirection) {
            case 'up': velocity.set(0, -200); break;
            case 'down': velocity.set(0, 200); break;
            case 'left': velocity.set(-200, 0); break;
            case 'right': velocity.set(200, 0); break;
        }
        projectile.setVelocity(velocity.x, velocity.y);

        this.time.delayedCall(480, () => projectile.destroy());

        this.physics.add.overlap(projectile, this.legendary, this.hitLegendary, null, this);
    }

    hitPipichick(projectile, chick) {
        const x = chick.x;
        const y = chick.y;
        this.pipichickPositions.push({ x, y });
        projectile.destroy();
        chick.destroy();

        const hitAnim = this.add.sprite(x, y, 'projectile');
        hitAnim.play('projectile_hit');
        hitAnim.on('animationcomplete', () => {
            //hitAnim.destroy();
            if (this.pipichicks.countActive(true) === 0 && !this.legendarySpawned) {
                this.spawnLegendary();
            }
        });
    }

    hitLegendary(projectile, legendary) {
        projectile.destroy();
        legendary.destroy();

        const hitAnim = this.add.sprite(legendary.x, legendary.y, 'projectile');
        hitAnim.play('projectile_hit');
        hitAnim.on('animationcomplete', () => {
            //hitAnim.destroy();
            this.pipichickPositions.forEach(({ x, y }) => this.launchFirework(x, y));
        });
    }

    spawnLegendary() {
        const x = this.scale.width / 2;
        const startY = -128;
        const targetY = this.scale.height / 2;

        this.legendary = this.physics.add.sprite(x, startY, 'legendary');
        this.legendary.setOrigin(0.5);
        this.legendary.play('legendary_appear');

        this.tweens.add({
            targets: this.legendary,
            y: targetY,
            duration: 3000,
            ease: 'Sine.easeInOut'
        });

        this.legendarySpawned = true;
    }

    update(time, delta) {
        const { left, right, up, down, shoot } = this.keys;

        if (left.isDown) {
            this.lastDirection = 'left';
            this.player.anims.play('walk_left', true);
            if (time - this.lastMoveTime > this.moveDelay) {
                this.player.x -= this.tileSize;
                this.lastMoveTime = time;
            }
        } else if (right.isDown) {
            this.lastDirection = 'right';
            this.player.anims.play('walk_right', true);
            if (time - this.lastMoveTime > this.moveDelay) {
                this.player.x += this.tileSize;
                this.lastMoveTime = time;
            }
        } else if (down.isDown) {
            this.lastDirection = 'down';
            this.player.anims.play('walk_down', true);
            if (time - this.lastMoveTime > this.moveDelay) {
                this.player.y += this.tileSize;
                this.lastMoveTime = time;
            }
        } else if (up.isDown) {
            this.lastDirection = 'up';
            this.player.anims.play('walk_up', true);
            if (time - this.lastMoveTime > this.moveDelay) {
                this.player.y -= this.tileSize;
                this.lastMoveTime = time;
            }
        } else {
            this.player.anims.stop();
        }

        if (Phaser.Input.Keyboard.JustDown(shoot)) {
            this.shootProjectile();
        }

        this.pipichicks.children.iterate(chick => {
            if (!chick) return;

            if (time > chick.nextMoveTime) {
                const dx = this.player.x - chick.x;
                const dy = this.player.y - chick.y;
                const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, chick.x, chick.y);

                if (distance < 64) {
                    if (Math.abs(dx) > Math.abs(dy)) {
                        chick.setVelocityX(dx > 0 ? -32 : 32);
                        chick.setVelocityY(0);
                    } else {
                        chick.setVelocityY(dy > 0 ? -32 : 32);
                        chick.setVelocityX(0);
                    }
                } else {
                    chick.setVelocity(Phaser.Math.Between(-32, 32), Phaser.Math.Between(-32, 32));
                }

                chick.nextMoveTime = time + 500;
            }
        });
    }
}

class TitleScreen extends Phaser.Scene {
    constructor() {
        super('TitleScreen');
    }

    preload() {
        Phaser.GameObjects.Image.DefaultPipeline = 'TextureTintPipeline';
        Phaser.GameObjects.Sprite.DefaultPipeline = 'TextureTintPipeline';
        Phaser.Textures.FilterMode = Phaser.Textures.FilterMode.NEAREST;

        this.load.spritesheet('title_anim', 'assets/Title3.png', {
            frameWidth: 128,
            frameHeight: 128
        });
    }

    create() {
        this.textures.get('title_anim').setFilter(Phaser.Textures.FilterMode.NEAREST);

        this.anims.create({
            key: 'title_intro',
            frames: this.anims.generateFrameNumbers('title_anim', { start: 0, end: 52 }),
            frameRate: 12,
            repeat: 0
        });

        this.anims.create({
            key: 'title_loop',
            frames: this.anims.generateFrameNumbers('title_anim', { start: 21, end: 52 }),
            frameRate: 10,
            repeat: -1
        });

        this.titleSprite = this.add.sprite(this.scale.width / 2, this.scale.height / 2, 'title_anim');
        this.titleSprite.setScale(3);
        this.titleSprite.play('title_intro');

        this.titleSprite.on('animationcomplete', () => {
            this.time.delayedCall(1000, () => {
                this.titleSprite.play('title_loop');
            });
        });

        this.input.keyboard.on('keydown', () => {
            this.scene.start('EasterGame');
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 640,
    scene: [TitleScreen, EasterGame],
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    }
};

new Phaser.Game(config);
