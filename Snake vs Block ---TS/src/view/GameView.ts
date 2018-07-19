/**Created by the LayaAirIDE*/

module view {
	export class GameView extends ui.GameViewUI {
		private snake: sprite.Snake;
		private blocks: Array<sprite.Block>;
<<<<<<< HEAD
		private snakeAdds: Array<sprite.SnakeAdd>;
=======
		private latestBlocks: Array<sprite.Block>;//最近生成的一行Block
		private snakeAdds: Array<sprite.SnakeAdd>; 
		private latestSnakeAdds: Array<sprite.SnakeAdd>; //最近生成的一行SnakeAdds
		private walls: Array<sprite.Wall>;
>>>>>>> a08349f2294123af71d66c91995bee3e7db2886f
		private lastMouseX: number;
		private mouseDown: boolean;
		private debugInfo: Laya.Text;
		public gameScrollSpeed: number;
		constructor() {
			super();
			/* for debug */
			this.debugInfo = new Laya.Text();
			this.debugInfo.width = 300;
			this.debugInfo.font = "Hei";
			this.debugInfo.fontSize = 20;
			this.debugInfo.color = "white";
			this.addChild(this.debugInfo);

			this.blocks = new Array<sprite.Block>();
			this.latestBlocks = new Array<sprite.Block>();
			this.snakeAdds = new Array<sprite.SnakeAdd>();
			this.latestSnakeAdds = new Array<sprite.SnakeAdd>();
			this.walls = new Array<sprite.Wall>();

		}
		public setDebugInfo(msg: string): void {
			this.debugInfo.text = msg;
		}

		public startGame(): void {
			this.gameScrollSpeed = 3;
			this.snake = new sprite.Snake();
			Laya.stage.addChild(this.snake);
			this.lastMouseX = Laya.stage.mouseX;
			this.snake.pos(0, 0);
			Laya.timer.frameLoop(1, this, this.mainLoop, null, false);// Every Frame
			this.snake.extendBody(15);
			Laya.stage.on(Laya.Event.MOUSE_DOWN, this, this.onMouseDown);
			Laya.stage.on(Laya.Event.MOUSE_UP, this, this.onMouseUp);
			// Laya.timer.frameLoop(100, this, this.updateBlocksStatus);//每300帧添加进行游戏状态更新，添加Block

			Laya.timer.frameOnce(100, this, this.updateBlocks_WALLStatus);//每个随机帧数添加进行游戏状态更新，添加Block、Wall
			//Laya.timer.frameOnce(100, this, this.updateWallsStatus);//每个随机帧数添加进行游戏状态更新，添加Wall
			Laya.timer.frameOnce(80, this, this.updateSnakeAddsStatus);//每个随机帧添加进行游戏状态更新，添加SnakeAdd
			Laya.timer.frameLoop(300, this.snake, this.snake.updateHeadHistory);

		}

		private onMouseDown(): void {
			this.mouseDown = true;
		}

		private onMouseUp(): void {
			this.mouseDown = false;
			this.debugInfo.text = 'mouseup'
		}

		// The Main Loop for the game 
		private mainLoop(): void {
			console.log('--Main Loop begin---')
			this.detectMouseMove();
			this.snake.updateBody();
			this.updateBlocks();
			this.updateSnakeAdds();
<<<<<<< HEAD
			console.log('--Main Loop end---')
=======
			this.updateWalls();
>>>>>>> a08349f2294123af71d66c91995bee3e7db2886f
		}

		// 检测触点移动情况
		private detectMouseMove(): void {
			let currentMouseX = Laya.stage.mouseX;
		
			if (this.mouseDown) {

				let level = 1;
				if (Math.abs(currentMouseX - this.lastMouseX) > 20) {
					level = 40;
				}
				else {
					level = Math.abs(currentMouseX - this.lastMouseX) * 2;
				}
				if (currentMouseX < this.lastMouseX) {
					this.snake.moveLeft(level);
				} else if (currentMouseX > this.lastMouseX) {
					this.snake.moveRight(level);
				}
			}
			this.lastMouseX = currentMouseX;
		}

		// 是否是正在正面碰撞
		private isDirectCollision(): boolean {
			return false;
		}

		// 更新方块集合Blocks
		private updateBlocks_WALLStatus(): void {
			//添加隔板
			let wallNumber = Common.getRandomArrayElements(Const.WALL_NUMBERS, 1);
			if (wallNumber[0] > 0) {
				let orders = Common.getRandomArrayElements([1, 2, 3, 4], wallNumber[0]);
				for (let i = 0; i < wallNumber[0]; i++) {
					let w = new sprite.Wall();
					w.setPos(orders[i] * 82.8 + 1, -Const.BLOCK_WIDTH);

					this.walls.push(w);
					this.addChildren(w);
				}
			}

			let blockNumber = Common.getRandomArrayElements(Const.BLOCK_NUMBERS, 1);
			if (blockNumber[0] > 0) {
				let orders = Common.getRandomArrayElements([0, 1, 2, 3, 4], blockNumber[0]);
				this.latestBlocks.splice(0, this.latestBlocks.length);//清空
				for (let i = 0; i < blockNumber[0]; i++) {
					let b = new sprite.Block();
					b.setPos(orders[i] * 82.8 + 41, -Const.BLOCK_WIDTH*2);
					//检测当前位置是否存在SnakeAdd
					let Flag = false;
					for(let j = 0; j < this.latestSnakeAdds.length; j++){
						let add = this.latestSnakeAdds[j];
						let x1 = b.PosX + (Const.BLOCK_WIDTH >> 1);
						let y1 = b.PosY + (Const.BLOCK_WIDTH >> 1);
						let x2 = add.PosX;
						let y2 =add.PosY;
						let calx = x1 - x2;
						let caly = y1 - y2;
						let dis = Math.pow(calx*calx + caly*caly, 0.5);

						if(dis <= (Const.BLOCK_MIN_CIRCLE_R+Const.SNAKE_BODY_RADIUS*2)){
							b.destory();
							Flag = true;
							break;
						}
					}
					if(Flag){
						continue;
					}
					//当前位置不存在SnakeAdd，则...
					this.blocks.push(b);
					this.latestBlocks.push(b);
					this.addChildren(b);
				}
			}
			let nextTimeNewBlocks = Common.getRandomArrayElements(Const.BLOCK_WALL_NEWTIMES, 1);
			Laya.timer.frameOnce(nextTimeNewBlocks[0], this, this.updateBlocks_WALLStatus);//每个随机帧数添加进行游戏状态更新，添加Block
		}

		// 更新Grow集合SnakeAdds
		private updateSnakeAddsStatus(): void {
			let snakeAddNumber = Common.getRandomArrayElements(Const.SNAKE_ADD_NUMBERS, 1);
			if (snakeAddNumber[0] > 0) {
				let orders = Common.getRandomArrayElements([0, 1, 2, 3, 4], snakeAddNumber[0]);
				this.latestSnakeAdds.splice(0, this.latestSnakeAdds.length);//清空
				for (let i = 0; i < snakeAddNumber[0]; i++) {
					let add = new sprite.SnakeAdd();
					add.setPos(orders[i] * 82.8 + 41, -Const.BLOCK_WIDTH*2);
					//检测当前位置是否存在Block
					let Flag = false;
					for(let j = 0; j < this.latestBlocks.length; j++){
						let block = this.latestBlocks[j];
						let x1 = block.PosX + (Const.BLOCK_WIDTH >> 1);
						let y1 = block.PosY + (Const.BLOCK_WIDTH >> 1);
						let x2 = add.PosX;
						let y2 =add.PosY;
						let calx = x1 - x2;
						let caly = y1 - y2;
						let dis = Math.pow(calx*calx + caly*caly, 0.5);

						if(dis <= (Const.BLOCK_MIN_CIRCLE_R+Const.SNAKE_BODY_RADIUS*2)){
							add.destory();
							Flag = true;
							break;
						}
					}
					if(Flag){
						continue;
					}
					//当前位置不存在Block，则...
					this.snakeAdds.push(add);
					this.latestSnakeAdds.push(add);
					this.addChildren(add);
				}
			}
			let nextTimeNewAdds = Common.getRandomArrayElements(Const.SNAKE_ADD_NEWTIMES, 1);
			Laya.timer.frameOnce(50, this, this.updateSnakeAddsStatus);//每个随机帧添加进行游戏状态更新，添加SnakeAdd	
		}

		// 更新碰撞检测信息
		private updateCollisionDetection(): void {

		}

		// 更新方块状态
		private updateBlocks(): void {
			this.blocks.forEach((block) => {
				if (!this.isDirectCollision()) {
					block.PosY += this.gameScrollSpeed;
					block.update();
				}

				if (block.PosY > Const.SCREEN_HEIGHT) {
					block.destory();
					console.log('destory block');
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

				if (snakeAdd.PosY > Const.SCREEN_HEIGHT) {
					snakeAdd.destory();
					console.log('destory snakeAdd');
					this.snakeAdds.splice(this.snakeAdds.indexOf(snakeAdd), 1);
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

				if (wall.PosY > Const.SCREEN_HEIGHT) {
					wall.destory();
					console.log('destory wall');
					this.walls.splice(this.walls.indexOf(wall), 1);
				}
			})
		}

	}
}