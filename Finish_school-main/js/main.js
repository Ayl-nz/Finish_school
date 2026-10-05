/* ============================================================
 *  main.js
 *  功能：
 *    1. 毕业时间倒计时（实时刷新）
 *    2. 点击 Good Bye 按钮，从底部发射烟花
 * ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================
     *  第一部分：毕业时间倒计时
     * ========================================================== */
    const siteLaunchDate = new Date('2024-06-08T17:00:00');

    function updateSiteUptime() {
        const currentDate = new Date();
        const uptime = currentDate - siteLaunchDate;

        if (uptime < 0) {
            document.getElementById('uptime').innerHTML = "毕业倒计时中...";
            return;
        }

        const seconds = Math.floor((uptime / 1000) % 60);
        const minutes = Math.floor((uptime / (1000 * 60)) % 60);
        const hours   = Math.floor((uptime / (1000 * 60 * 60)) % 24);
        const days    = Math.floor(uptime / (1000 * 60 * 60 * 24));

        document.getElementById('uptime').innerHTML =
            `${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒`;
    }

    updateSiteUptime();
    setInterval(updateSiteUptime, 1000);

    /* ==========================================================
     *  第二部分：烟花特效
     * ========================================================== */
    (function fireworks() {
        'use strict';

        /* ---------- 1. 创建全屏 Canvas ---------- */
        const canvas = document.createElement('canvas');
        canvas.id = 'fireworks-canvas';
        Object.assign(canvas.style, {
            position: 'fixed',
            inset: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',   // 不阻挡页面点击
            zIndex: '9999'
        });
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let W = 0, H = 0;

        function resize() {
            const dpr = window.devicePixelRatio || 1;
            W = window.innerWidth;
            H = window.innerHeight;
            canvas.width  = W * dpr;
            canvas.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 适配高清屏
        }
        resize();
        window.addEventListener('resize', resize);

        /* ---------- 2. 数据结构 ---------- */
        const rockets   = [];   // 上升中的火箭
        const particles = [];   // 爆炸后的粒子

        const HUES = [20, 45, 160, 200, 280, 330, 0]; // 烟花配色

        /* ---------- 3. 火箭类 ---------- */
        class Rocket {
            constructor(x, targetY) {
                this.x = x;
                this.y = H;
                this.targetY = targetY;
                this.vx = (Math.random() - 0.5) * 2.2;
                this.vy = -(Math.random() * 4 + 14);
                this.gravity = 0.2;
                this.hue = HUES[Math.floor(Math.random() * HUES.length)];
                this.trail = [];
                this.dead = false;
            }

            update() {
                this.trail.push({ x: this.x, y: this.y });
                if (this.trail.length > 10) this.trail.shift();

                this.x += this.vx;
                this.y += this.vy;
                this.vy += this.gravity;

                if (this.vy >= 0 || this.y <= this.targetY) {
                    this.explode();
                    this.dead = true;
                }
            }

            explode() {
                const count = 70 + Math.floor(Math.random() * 50);
                const hue = this.hue;
                const isRing = Math.random() > 0.5;

                for (let i = 0; i < count; i++) {
                    let angle, speed;
                    if (isRing) {
                        angle = (Math.PI * 2 * i) / count;
                        speed = 3 + Math.random() * 1.2;
                    } else {
                        angle = Math.random() * Math.PI * 2;
                        speed = Math.random() * 6 + 1;
                    }
                    particles.push(new Particle(
                        this.x,
                        this.y,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        hue + (Math.random() - 0.5) * 40
                    ));
                }
            }

            draw() {
                for (let i = 0; i < this.trail.length; i++) {
                    const t = this.trail[i];
                    const ratio = i / this.trail.length;
                    ctx.globalAlpha = ratio * 0.6;
                    ctx.fillStyle = `hsl(${this.hue}, 100%, 65%)`;
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, 1.8 * ratio + 0.6, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
                ctx.fillStyle = `hsl(${this.hue}, 100%, 80%)`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 2.8, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        /* ---------- 4. 粒子类 ---------- */
        class Particle {
            constructor(x, y, vx, vy, hue) {
                this.x = x;
                this.y = y;
                this.vx = vx;
                this.vy = vy;
                this.hue = hue;
                this.life = 1;
                this.decay = Math.random() * 0.012 + 0.008;
                this.size = Math.random() * 1.8 + 1;
                this.friction = 0.975;
                this.gravity = 0.055;
            }

            update() {
                this.vx *= this.friction;
                this.vy *= this.friction;
                this.vy += this.gravity;
                this.x += this.vx;
                this.y += this.vy;
                this.life -= this.decay;
            }

            draw() {
                if (this.life <= 0) return;
                ctx.globalAlpha = Math.max(this.life, 0);
                ctx.fillStyle = `hsl(${this.hue}, 100%, ${55 + this.life * 20}%)`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * this.life + 0.4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        /* ---------- 5. 主循环 ---------- */
        function loop() {
            // 拖尾残影
            ctx.globalCompositeOperation = 'destination-out';
            ctx.globalAlpha = 1;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
            ctx.fillRect(0, 0, W, H);

            // 发光叠加
            ctx.globalCompositeOperation = 'lighter';

            for (let i = rockets.length - 1; i >= 0; i--) {
                rockets[i].update();
                rockets[i].draw();
                if (rockets[i].dead) rockets.splice(i, 1);
            }

            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                particles[i].draw();
                if (particles[i].life <= 0) particles.splice(i, 1);
            }

            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';

            requestAnimationFrame(loop);
        }
        loop();

        /* ---------- 6. 发射控制 ---------- */
        function launchFireworks() {
            const total = 10;
            for (let i = 0; i < total; i++) {
                setTimeout(() => {
                    const x = W * 0.1 + Math.random() * W * 0.8;
                    const targetY = H * 0.08 + Math.random() * H * 0.35;
                    rockets.push(new Rocket(x, targetY));
                }, i * 120);
            }
        }

        const btn = document.querySelector('.btn-goodbye');
        if (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                launchFireworks();
            });
        }
    })();

});