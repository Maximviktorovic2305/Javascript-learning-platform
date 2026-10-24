export function question(prompt, correct, wrongA, wrongB, explanation, section = 1) {
  return {prompt, options:[correct,wrongA,wrongB],answer:0,explanation,section};
}
export function exercise(prompt, starterCode, solution, cases, hint, node = false) {
  return {prompt,starterCode,solution,tests:cases.map(([input,expected])=>({input,expected})),hint,runtime:node?'node':'universal'};
}
export const exImports = 'const express = require("express");\nconst request = require("supertest");\n';
export const nestImports = 'import "reflect-metadata";\nimport { Module, Injectable, Controller, Get, Post, Body, Param, Query, Inject, UseGuards, UsePipes, UseInterceptors, SetMetadata, HttpException, BadRequestException, NotFoundException, ParseIntPipe, ValidationPipe, CanActivate, ExecutionContext, NestInterceptor, CallHandler, Catch, ExceptionFilter, ArgumentsHost } from "@nestjs/common";\nimport { NestFactory, Reflector } from "@nestjs/core";\nimport request from "supertest";\n';
export function define(trackId, slug, summary, task, quiz) { return {id:`${trackId}-${slug}`,summary,exercise:task,questions:quiz}; }
