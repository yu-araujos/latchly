import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export async function getBoardById(req: Request<{ id: string }>, res: Response) {
  try { 
    const { id } = req.params;

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
              include: {
                lock: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    
    return res.status(200).json(board);
  } catch (error) {
    console.error('[BoardController.getBoardById] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}