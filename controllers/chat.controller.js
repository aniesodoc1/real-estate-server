import prisma from "../lib/prisma.js";

export const getChats = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const chats = await prisma.chat.findMany({
      where: {
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    for (const chat of chats) {
      const receiverId = chat.userIDs.find((id) => id !== tokenUserId);

      const receiver = await prisma.user.findUnique({
        where: {
          id: receiverId,
        },
        select: {
          id: true,
          phonenumber: true,
          email: true,
          avatar: true,
        },
      }
    );
      chat.receiver = receiver;
    }

    res.status(200).json(chats);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get chats!" });
  }
};

export const getChat = async (req, res) => {
  const tokenUserId = req.userId;
  const chatId = req.params.id;

  try {
    // Find the chat and include messages
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userIDs: {
          hasSome: [tokenUserId], // Ensure user is part of the chat
        },
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
        users: {
          select: {
            id: true,
            phonenumber: true,
            avatar: true,
          },
        },
      },
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found!" });
    }

    // Find the receiver (the other user in the chat)
    const receiver = chat.users.find((user) => user.id !== tokenUserId);

    // Only update `seenBy` if the user hasn't already seen it
    if (!chat.seenBy.includes(tokenUserId)) {
      await prisma.chat.update({
        where: { id: chatId },
        data: {
          seenBy: {
            push: tokenUserId, // Add the user to seenBy list
          },
        },
      });
    }

    res.status(200).json({ ...chat, receiver }); // Send receiver info
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get chat!" });
  }
};


export const addChat = async (req, res) => {
  const tokenUserId = req.userId;
  const { receiverId } = req.body;

  try {
    // Check if chat exists
    let chat = await prisma.chat.findFirst({
      where: {
        userIDs: { hasEvery: [tokenUserId, receiverId] },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        users: {
          select: {
            id: true,
            phonenumber: true,
            avatar: true,
          },
        },
      },
    });

    if (!chat) {
      // Create new chat
      chat = await prisma.chat.create({
        data: {
          userIDs: [tokenUserId, receiverId],
        },
        include: {
          messages: true,
          users: {
            select: {
              id: true,
              phonenumber: true,
              avatar: true,
            },
          },
        },
      });
    }

    // Find the receiver (the other user in the chat)
    const receiver = chat.users.find((user) => user.id !== tokenUserId);

    res.status(200).json({
      ...chat,
      receiver, // Send receiver's details
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to add chat!" });
  }
};

export const readChat = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const chat = await prisma.chat.update({
      where: {
        id: req.params.id,
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
      data: {
        seenBy: {
          set: [tokenUserId],
        },
      },
    });
    res.status(200).json(chat);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to read chat!" });
  }
};
