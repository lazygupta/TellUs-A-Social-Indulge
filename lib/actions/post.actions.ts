"use server"

import { Supermercado_One } from "next/font/google";
import Post from "../models/post.model";
import { connectToDB } from "../mongoose";
import { revalidatePath } from "next/cache";
import User from "../models/user.model";

interface Params {
    text: string,
    author: string,
    communityId: string | null,
    path: string,
}

export async function CreatePost({ text, author, communityId, path }: Params) {
    try {
        connectToDB();

        const createdPost = await Post.create({
            text,
            author,
            community: null,
        });

        await User.findByIdAndUpdate(author, {
            $push: { posts: createdPost._id }
        })

        revalidatePath(path);

    } catch (error: any) {
        throw new Error('Error creating post: ${error.message}')
    }

};

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
    connectToDB();

const skipAmount = (pageNumber - 1)* pageSize;

    const postsQuery = Post.find({ parentId: { $in: [null,undefined]}})
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(pageSize)
    .populate({ path: 'author', model: User })
    .populate({
        path: 'children',
        populate: {
        path: 'author',
        model: User,
        select: "_id name parentId image"
    }
    })

    const totalPostsCount = await Post.countDocuments({ parentId: { $in: [null,undefined]} 
    })
    const posts = await postsQuery.exec();
    const isNext = totalPostsCount > skipAmount + posts.length;
    return { posts, isNext}
}

export async function fetchPostById(id:string) {
    connectToDB();
    try {
        const post = await Post.findById(id)
        .populate({
            path: 'author',
            model: User,
            select: "_id id name image"
        })
        .populate({
            path: 'children',
            populate: [
            {
              path: 'author',
              model: User,
              select: "_id id name parentId image"
        },
        {
            path: 'children',
            model: Post,
            populate: {
                path: 'author',
                model: 'User',
                select: "_id id name parentId image"
            }
        }
    ]
}).exec();
      return post;
    } catch (error: any) {
        throw new Error(`Error fetching post: ${error.message}`)
    }
}

export async function addCommentToPost(
    postId: string,
    commentText: string,
    userId: string,
    path: string,
){
    connectToDB();
    try {
        const originalPost = await Post.findById(postId);

        if(!originalPost) {
            throw new Error("Post not found")
        }
        
       const commentPost = new Post({
       text: commentText,
       author: userId,
       parentId: postId,
       })

       const savedCommentPost = await commentPost.save(); 
       originalPost.children.push(savedCommentPost._id);
       await originalPost.save();
       revalidatePath(path);
    }  catch(error:any) {
        throw new Error(`Error adding comment to post: ${error.message}`)
    }
}
