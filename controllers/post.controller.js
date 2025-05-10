import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import { promisify } from "util";

const verifyToken = promisify(jwt.verify);

export const getPosts = async (req, res) => {
    const query = req.query;
    console.log(query);

    try {
        const posts = await prisma.post.findMany({
            where: {
                city: query.city || undefined,
                type: query.type || undefined,
                property: query.property || undefined,
                bedroom: parseInt(query.bedroom) || undefined,
                price: {
                    gte: parseInt(query.minPrice) || 0,
                    lte: parseInt(query.maxPrice) || 1000000,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.status(200).json(posts);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to get posts" });
    }
};

export const getPost = async (req, res) => {
    const id = req.params.id;

    try {
        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                postDetail: true,
                user: {
                    select: {
                        phonenumber: true,
                        avatar: true,
                    },
                },
            },
        });

        let userId = null;
        const token = req.cookies?.token;

        if (token) {
            try {
                const payload = await verifyToken(token, process.env.JWT_SECRET_KEY);
                userId = payload.id;
            } catch (err) {
                console.log("Token verification failed:", err.message);
            }
        }

        let isSaved = false;

        if (userId) {
            const saved = await prisma.savedPost.findUnique({
                where: {
                    userId_postId: {
                        postId: id,
                        userId,
                    },
                },
            });

            isSaved = !!saved; // Convert to boolean
        }

        res.status(200).json({ ...post, isSaved });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to get post" });
    }
};

export const savePost = async (req, res) => {
    const { postId } = req.body;
    let userId = null;

    try {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({ message: "Authentication required. Please log in." });
        }

        try {
            const payload = await verifyToken(token, process.env.JWT_SECRET_KEY);
            userId = payload.id;
        } catch (err) {
            console.log("Token verification failed:", err.message);
            return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
        }

        const saved = await prisma.savedPost.findUnique({
            where: {
                userId_postId: {
                    postId,
                    userId,
                },
            },
        });

        res.status(200).json({ isSaved: saved ? true : false });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to check save status" });
    }
};

export const addPost = async (req, res) => {
    const body = req.body;
    const tokenUserId = req.userId;
  
    try {
      const newPost = await prisma.post.create({
        data: {
          ...body.postData,
          userId: tokenUserId,
          videos: body.postData.videos || [],  
          postDetail: {
            create: body.postDetail,
          },
        },
      });
  
      res.status(200).json(newPost);
    } catch (err) {
      console.log("Error creating post:", err);
      res.status(500).json({ message: "Failed to create post" });
    }
  };
  
export const updatePost = async (req, res) => {
    try {
        res.status(200).json();
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to update post" });
    }
};

export const deletePosts = async (req, res) => {
    const id = req.params.id;
    const tokenUserId = req.userId;
  
    try {
      const post = await prisma.post.findUnique({
        where: { id },
      });
  
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
  
      if (post.userId !== tokenUserId) {
        return res.status(403).json({ message: "Not Authorized!" });
      }
  
      // Delete the related post detail first
      await prisma.postDetail.deleteMany({
        where: { postId: id },
      });

      await prisma.savedPost.deleteMany({ where: { postId: id } });
  
      // Then delete the post
      await prisma.post.delete({
        where: { id },
      });
  
      res.status(200).json({ message: "Post deleted successfully" });
    } catch (err) {
      console.log("Error deleting post:", err);
      res.status(500).json({ message: "Failed to delete post" });
    }
  };
  