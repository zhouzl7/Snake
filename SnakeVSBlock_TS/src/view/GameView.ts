/**Created by the LayaAirIDE*/

module view {
	export class GameView extends ui.GameViewUI {
		public snake: sprite.Snake;
		private blocks: Array<sprite.Block>;
		private latestBlocks: Array<sprite.Block>;//最近生成的一行Block
		private snakeAdds: Array<sprite.SnakeAdd>;
		private latestSnakeAdds: Array<sprite.SnakeAdd>; //最近生成的一行SnakeAdds
		private walls: Array<sprite.Wall>;
		private shields: Array<sprite.Shield>;
		private lastMouseX: number;
		private mouseDown: boolean;
		public gameScrollSpeed: number = Const.GAME_SCROLL_SPEED;
		public directCollision: boolean = false;
		public score: number = 0;
		public scoreDisplay: Laya.Text;
		private nextTimeNewBlocks: number;
		private nextTimeNewAdds: number;

		constructor() {
			super();

			this.scoreDisplay = new Laya.Text();
			this.scoreDisplay.width = 100;
			this.scoreDisplay.pos(Const.SCREEN_WIDTH - 25, 0);
			this.scoreDisplay.font = 'Arial';
			this.scoreDisplay.fontSize = 40;
			this.scoreDisplay.color = "white";
			this.scoreDisplay.text = this.score.toString();


			this.snake = new sprite.Snake();
			this.blocks = new Array<sprite.Block>();
			this.latestBlocks = new Array<sprite.Block>();
			this.snakeAdds = new Array<sprite.SnakeAdd>();
			this.latestSnakeAdds = new Array<sprite.SnakeAdd>();
			this.walls = new Array<sprite.Wall>();
			this.shields = new Array<sprite.Shield>();
		}


		public startGame(): void {
			this.addChild(this.scoreDisplay);
			this.score = 0;

			this.nextTimeNewAdds = undefined;
			this.nextTimeNewBlocks = undefined;
			GameMain.status = GameStatus.Underway;
			this.snake.bodyPosX[0] = Const.SCREEN_WIDTH / 2;
			this.snake.length = 1;
			this.snake.bodyPosY[0] = Const.SCREEN_HEIGHT / 2;

			Laya.stage.addChild(this.snake);
			Laya.timer.frameLoop(1, this, this.mainLoop, null, false);// Every Frame
			Laya.stage.on(Laya.Event.MOUSE_DOWN, this, this.onMouseDown);
			Laya.stage.on(Laya.Event.MOUSE_UP, this, this.onMouseUp);
			// Laya.timer.frameLoop(100, this, this.updateBlocksStatus);//每300帧添加进行游戏状态更新，添加Block

			Laya.timer.frameOnce(100, this, this.updateBlocks_WALLStatus);//第一个100帧添加进行游戏状态更新，添加Block、Wall
			Laya.timer.frameOnce(80, this, this.updateSnakeAddsStatus);//第一个80帧帧添加进行游戏状态更新，添加SnakeAdd
			Laya.timer.frameLoop(300, this.snake, this.snake.updateHeadHistory);
			//Laya.timer.frameLoop(2, this.snake, this.snake.showBody);
		}

		private onMouseDown(): void {
			this.mouseDown = true;
			this.lastMouseX = Laya.stage.mouseX;
		}

		private onMouseUp(): void {
			this.mouseDown = false;
		}

		private updateScore(): void {
			this.scoreDisplay.text = this.score.toString();
			if (this.score > 0) {
				let offset = Math.floor(Math.log(this.score) / Math.log(10))
				this.scoreDisplay.pos(Const.SCREEN_WIDTH - 25 * (offset + 1), 0);
			}
			else {
				this.scoreDisplay.pos(Const.SCREEN_WIDTH - 25, 0);
			}
		}

		private updateGameStatus() {
			this.gameScrollSpeed = Const.GAME_SCROLL_SPEED + Math.floor(this.snake.length / 10) * 0.1;
		}

		// The Main Loop for the game 
		private mainLoop(): void {
			this.updateGameStatus();
			this.updateCollisionDetection();
			this.updateScore();
			this.detectMouseMove();
			this.snake.updateBody();
			this.snake.showBody();
			this.updateBlocks();
			this.updateSnakeAdds();
			this.updateShields();
			this.updateWalls();


			//更新snake_superTime
			if (this.snake.state === Const.SNAKE_STATE_SUPER) {
				if (this.snake.superTime === 0) {
					this.snake.setState(Const.SNAKE_STATE_NORMAL);
					this.snake.superTime = Const.SNAKE_SUPER_TIME;
				}
				else {
					this.snake.superTime--;
				}
			}

			// 更新方块集合Blocks
			if (this.nextTimeNewBlocks === undefined) {

			}
			else {
				if (this.nextTimeNewBlocks <= 0) {
					this.updateBlocks_WALLStatus();
				}
				else {
					if (!this.isDirectCollision())
						this.nextTimeNewBlocks -= this.gameScrollSpeed;;
				}
			}

			// 更新Grow集合SnakeAdds 
			if (this.nextTimeNewAdds === undefined) {

			}
			else {
				if (this.nextTimeNewAdds <= 0) {
					this.updateSnakeAddsStatus();
				}
				else {
					if (!this.isDirectCollision())
						this.nextTimeNewAdds -= this.gameScrollSpeed;
				}
			}

		}

		// 检测触点移动情况，据此控制蛇的移动
		private detectMouseMove(): void {
			let currentMouseX = Laya.stage.mouseX;//当前触点位置

			if (this.mouseDown) {
				let level = 1;
				if (Math.abs(currentMouseX - this.lastMouseX) > 20) {
					level = 40;
				}
				else {
					level = Math.abs(currentMouseX - this.lastMouseX) * 2;
				}
				let direction: string;
				if (currentMouseX < this.lastMouseX)
					direction = 'left';
				else if (currentMouseX > this.lastMouseX)
					direction = 'right';

				// 方块左右两侧不可穿越
				this.blocks.forEach((block) => {
					if (block.PosY >= this.snake.bodyPosY[0] - Const.BLOCK_WIDTH / 2
						&& block.PosY <= this.snake.bodyPosY[0] + Const.BLOCK_WIDTH / 2) {
						switch (direction) {
							case 'left': {
								if (block.PosX < this.snake.bodyPosX[0] // 方块在蛇头左侧
									&& this.snake.bodyPosX[0] - level < block.PosX + Const.BLOCK_WIDTH / 2 + Const.SNAKE_BODY_RADIUS) {
									level = Math.min(level, Math.abs(block.PosX - this.snake.bodyPosX[0]) - (Const.BLOCK_WIDTH / 2 + Const.SNAKE_BODY_RADIUS));
								}
								break;
							}
							case 'right': {
								if (block.PosX > this.snake.bodyPosX[0] // 方块在蛇头右侧
									&& this.snake.bodyPosX[0] + level > block.PosX - Const.BLOCK_WIDTH / 2 - Const.SNAKE_BODY_RADIUS) {
									level = Math.min(level, Math.abs(block.PosX - this.snake.bodyPosX[0]) - (Const.BLOCK_WIDTH / 2 + Const.SNAKE_BODY_RADIUS));
								}
								break;
							}
						}
					}
				})

				// 墙体不可穿越
				this.walls.forEach((wall) => {
					// 蛇头位置在墙体范围内
					if (wall.centerPoSY() + wall.len / 2 + Const.SNAKE_BODY_RADIUS > this.snake.bodyPosY[0]
						&& wall.centerPoSY() - wall.len / 2 - Const.SNAKE_BODY_RADIUS < this.snake.bodyPosY[0]) {
						switch (direction) {
							case 'left': {
								if (Math.abs(wall.centerPosX() - this.snake.bodyPosX[0]) <= Const.WALL_WIDTH / 2 + Const.SNAKE_BODY_RADIUS
									&& wall.centerPosX() < this.snake.bodyPosX[0]) {
									level = 0;

								}

								if (wall.centerPosX() < this.snake.bodyPosX[0] //墙体在蛇头左侧
									&& this.snake.bodyPosX[0] - level < wall.centerPosX() + Const.WALL_WIDTH / 2 + Const.SNAKE_BODY_RADIUS) {
									level = Math.min(level, Math.abs(Math.abs(wall.centerPosX() - this.snake.bodyPosX[0]) - Const.WALL_WIDTH / 2 - Const.SNAKE_BODY_RADIUS));
								}
								break;
							}
							case 'right': {
								if (Math.abs(wall.centerPosX() - this.snake.bodyPosX[0]) <= Const.WALL_WIDTH / 2 + Const.SNAKE_BODY_RADIUS
									&& wall.centerPosX() > this.snake.bodyPosX[0]) {
									level = 0;
								}

								if (wall.centerPosX() > this.snake.bodyPosX[0] //墙体在蛇头右侧
									&& this.snake.bodyPosX[0] + level > wall.centerPosX() - Const.WALL_WIDTH / 2 - Const.SNAKE_BODY_RADIUS) {
									level = Math.min(level, Math.abs(Math.abs(wall.centerPosX() - this.snake.bodyPosX[0]) - Const.WALL_WIDTH / 2 - Const.SNAKE_BODY_RADIUS));
								}
								break;
							}
						}
					}
				})

				switch (direction) {
					case 'left': this.snake.moveLeft(level); break;
					case 'right': this.snake.moveRight(level); break;
				}
			}
			this.lastMouseX = currentMouseX;
		}

		// 是否是正在正面碰撞
		public isDirectCollision(): boolean {
			return this.directCollision;
		}

		// 更新方块集合Blocks、隔板集合Walls
		private updateBlocks_WALLStatus(): void {
			//添加隔板
			let wallNumber = Common.getRandomArrayElements(Const.WALL_NUMBERS, 1);
			if (wallNumber[0] > 0) {
				let orders = Common.getRandomArrayElements([1, 2, 3, 4], wallNumber[0]);
				for (let i = 0; i < wallNumber[0]; i++) {
					let w = new sprite.Wall();
					w.setPos(orders[i] * 82.8 + 37.2, -Const.BLOCK_WIDTH * 3 - 7.5);

					this.walls.push(w);
					this.addChildren(w);
				}
			}

			let blockNumber = Common.getRandomArrayElements(Const.BLOCK_NUMBERS, 1);
			let starBlock_order = undefined;
			if (blockNumber[0] === 5 || blockNumber[0] === 4) {
				if (Common.getRandomNumber(0, 1) === 1) {
					starBlock_order = Common.getRandomNumber(0, blockNumber[0] - 1);
				}
			}
			if (blockNumber[0] > 0) {
				let orders = Common.getRandomArrayElements([0, 1, 2, 3, 4], blockNumber[0]);
				this.latestBlocks.splice(0, this.latestBlocks.length);//清空
				for (let i = 0; i < blockNumber[0]; i++) {
					let b = new sprite.Block();
					b.setPos(orders[i] * 82.8 + 41, -Const.BLOCK_WIDTH * 4);
					//检测当前位置是否存在SnakeAdd
					let Flag = false;
					for (let j = 0; j < this.latestSnakeAdds.length; j++) {
						let add = this.latestSnakeAdds[j];
						let x1 = b.PosX;
						let y1 = b.PosY;
						let x2 = add.PosX;
						let y2 = add.PosY;
						let calx = x1 - x2;
						let caly = y1 - y2;
						let dis = Math.pow(calx * calx + caly * caly, 0.5);

						if (dis <= (Const.BLOCK_MIN_CIRCLE_R + Const.SNAKE_BODY_RADIUS * 2)) {
							b.destory();
							Flag = true;
							break;
						}
					}
					if (Flag) {
						continue;
					}
					//当前位置不存在SnakeAdd，则...
					if (starBlock_order === i) {
						b.setState(Const.BLOCK_STATE_SPECIAL);
						this.blocks.push(b);
						this.latestBlocks.push(b);
						this.addChildren(b);
					}
					else {
						this.blocks.push(b);
						this.latestBlocks.push(b);
						this.addChildren(b);
					}

				}
			}
			this.nextTimeNewBlocks = Common.getRandomArrayElements(Const.BLOCK_WALL_NEWTIMES, 1)[0];
		}

		// 更新Grow集合SnakeAdds、Shields
		private updateSnakeAddsStatus(): void {
			let snakeAddNumber = Common.getRandomArrayElements(Const.SNAKE_ADD_NUMBERS, 1);
			let shield_order;
			if (snakeAddNumber[0] == 4) {
				shield_order = Common.getRandomNumber(0, snakeAddNumber[0] - 1);
			}
			if (snakeAddNumber[0] > 0) {
				let orders = Common.getRandomArrayElements([0, 1, 2, 3, 4], snakeAddNumber[0]);
				this.latestSnakeAdds.splice(0, this.latestSnakeAdds.length);//清空
				for (let i = 0; i < snakeAddNumber[0]; i++) {
					let add;
					if (snakeAddNumber[0] == 4 && i == shield_order) {
						add = new sprite.Shield();
					}
					else {
						add = new sprite.SnakeAdd();
					}
					add.setPos(orders[i] * 82.8 + 41, -Const.BLOCK_WIDTH * 4);
					//检测当前位置是否存在Block
					let Flag = false;
					for (let j = 0; j < this.latestBlocks.length; j++) {
						let block = this.latestBlocks[j];
						let x1 = block.PosX;
						let y1 = block.PosY;
						let x2 = add.PosX;
						let y2 = add.PosY;
						let calx = x1 - x2;
						let caly = y1 - y2;
						let dis = Math.pow(calx * calx + caly * caly, 0.5);

						if (dis <= (Const.BLOCK_MIN_CIRCLE_R + Const.SNAKE_BODY_RADIUS * 2)) {
							add.destory();
							Flag = true;
							break;
						}
					}
					if (Flag) {
						continue;
					}
					//当前位置不存在Block，则...
					if (snakeAddNumber[0] == 4 && i == shield_order) {
						this.shields.push(add);
					}
					else {
						this.snakeAdds.push(add);
					}
					this.latestSnakeAdds.push(add);
					this.addChildren(add);
				}
			}
			this.nextTimeNewAdds = Common.getRandomArrayElements(Const.SNAKE_ADD_NEWTIMES, 1)[0];
		}

		// 更新碰撞检测信息
		private updateCollisionDetection(): void {

			// 先检测是否碰到了snakeAdd
			this.snakeAdds.forEach((snakeAdd) => {
				if ((snakeAdd.PosX - this.snake.bodyPosX[0]) ** 2 + (snakeAdd.PosY - this.snake.bodyPosY[0]) ** 2
					< Const.SNAKE_BODY_RADIUS ** 2 * 4) {
					this.snake.extendBody(snakeAdd.getValue());
					snakeAdd.destory();
					this.snakeAdds.splice(this.snakeAdds.indexOf(snakeAdd), 1);
					Laya.SoundManager.playSound(Const.EAT_SNAKE_ADD_SOUND);
				}
			})

			// 是否碰到了 shield 道具
			this.shields.forEach((shield) => {
				if ((shield.PosX - this.snake.bodyPosX[0]) ** 2 + (shield.PosY - this.snake.bodyPosY[0]) ** 2
					< Const.SNAKE_BODY_RADIUS ** 2 * 4) {
					Laya.SoundManager.playSound(Const.EAT_SHIELD_SOUND);//音效	
					//TODO: change the body color of this.snake OR someother specile effect
					if (this.snake.state === Const.SNAKE_STATE_NORMAL) {
						this.snake.setState(Const.SNAKE_STATE_SHIELD);
					}

					shield.destory();
					this.shields.splice(this.shields.indexOf(shield), 1);
				}
			})

			this.directCollision = false;

			// 对方块正面的碰撞
			this.blocks.forEach((block) => {
				if (block.PosX - Const.BLOCK_WIDTH / 2 <= this.snake.bodyPosX[0] + Const.SNAKE_BODY_RADIUS / 2
					&& block.PosX + Const.BLOCK_WIDTH / 2 >= this.snake.bodyPosX[0] - Const.SNAKE_BODY_RADIUS / 2 // X资本 在方块范围内
					&& (this.snake.bodyPosY[0] - block.PosY) < (Const.BLOCK_WIDTH / 2 + Const.SNAKE_BODY_RADIUS + 4)
					&& block.PosY < this.snake.bodyPosY[0]) {
					this.directCollision = true;

					if (this.snake.state === Const.SNAKE_STATE_SHIELD) {
						this.snake.setState(Const.SNAKE_STATE_NORMAL);
						this.score += block.getValue();
						block.setValue(0);
					}
					else if (this.snake.state === Const.SNAKE_STATE_SUPER) {
						this.score += block.getValue();
						block.setValue(0);
					}
					if (!block.decreaseValue() || block.getValue() === 0) {
						let p = new sprite.ParticleCtn();
						p.setPos(block.PosX, block.PosY);
						p.update();
						this.addChild(p);
						if (block.state === Const.BLOCK_STATE_NORMAL) {
							Laya.SoundManager.playSound(Const.BLOCK_BREAK);//音效
						}
						else if (block.state === Const.BLOCK_STATE_SPECIAL) {
							//TODU: change the state of snake to Super mode
							this.snake.superTime = Const.SNAKE_SUPER_TIME;
							this.snake.setState(Const.SNAKE_STATE_SUPER);
							Laya.SoundManager.playSound(Const.EAT_SHIELD_SOUND);//音效
						}


						block.destory();
						this.blocks.splice(this.blocks.indexOf(block), 1);
					}
					if (this.snake.length <= 0) {
						this.onGameOver();
					}
				}
			})

			// 对墙体的正面碰撞，可以导致蛇停下
			this.walls.forEach((wall) => {
				if (wall.centerPosX() - Const.SNAKE_BODY_RADIUS <= this.snake.bodyPosX[0]
					&& wall.centerPosX() + Const.SNAKE_BODY_RADIUS >= this.snake.bodyPosX[0]
					&& Math.abs(wall.centerPoSY() + wall.len / 2 - (this.snake.bodyPosY[0] - Const.SNAKE_BODY_RADIUS)) < 5) {
					this.directCollision = true;
				}
			})
		}

		// 更新方块状态
		private updateBlocks(): void {
			this.blocks.forEach((block) => {
				if (!this.isDirectCollision()) {
					block.PosY += this.gameScrollSpeed;
				}
				block.update();
				if ((block.PosY - (Const.BLOCK_WIDTH)) > Const.SCREEN_HEIGHT) {
					block.destory();
					this.blocks.splice(this.blocks.indexOf(block), 1);
				}
			})
		}

		// 更新SnakeAdd状态
		private updateSnakeAdds(): void {
			this.snakeAdds.forEach((snakeAdd) => {
				if (!this.isDirectCollision()) {
					snakeAdd.PosY += this.gameScrollSpeed;
					snakeAdd.update();
				}
				if ((snakeAdd.PosY - Const.SNAKE_BODY_RADIUS * 2) > Const.SCREEN_HEIGHT) {
					snakeAdd.destory();
					this.snakeAdds.splice(this.snakeAdds.indexOf(snakeAdd), 1);
				}
			})
		}

		// 更新Shield状态
		private updateShields(): void {
			this.shields.forEach((shield) => {
				if (!this.isDirectCollision()) {
					shield.PosY += this.gameScrollSpeed;
					shield.update();
				}

				if ((shield.PosY - Const.SNAKE_BODY_RADIUS * 2) > Const.SCREEN_HEIGHT) {
					shield.destory();
					this.shields.splice(this.shields.indexOf(shield), 1);
				}
			})
		}

		// 更新隔板状态
		private updateWalls(): void {
			this.walls.forEach((wall) => {
				if (!this.isDirectCollision()) {
					wall.PosY += this.gameScrollSpeed;
					wall.update();
				}

				if ((wall.PosY - (wall.len >> 1)) > Const.SCREEN_HEIGHT) {
					wall.destory();
					this.walls.splice(this.walls.indexOf(wall), 1);
				}
			})
		}

		// 游戏结束时的处理
		private onGameOver(): void {
			// 清除所有sprite以及计时器
			this.removeChildren();
			Laya.timer.clearAll(this);

			// 请除储存的队列
			this.blocks.splice(0, this.blocks.length);
			this.walls.splice(0, this.walls.length);
			this.snakeAdds.splice(0, this.snakeAdds.length);
			this.latestBlocks.splice(0, this.latestBlocks.length);
			this.latestSnakeAdds.splice(0, this.latestSnakeAdds.length);
			this.shields.splice(0, this.shields.length);


			GameMain.status = GameStatus.Over;

			this.removeSelf();
			if (!GameMain.gameOver) {
				GameMain.gameOver = new view.GameOver();
			}
			Laya.stage.removeChildren();
			Laya.stage.addChild(GameMain.gameOver);
			GameMain.gameOver.drawUI();
		}

	}
}