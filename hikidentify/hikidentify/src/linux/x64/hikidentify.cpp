#include <stdio.h>
#include<node_api.h>
#include <stdlib.h>
#include <dlfcn.h>
#include<memory.h>
#include<iostream>  
#include<sstream>
#include<fstream>
#include<vector>

using namespace std;
//定义三个函数指针，具体需要so里面用哪些函数，就多写对应的函数指针 赋值给他
typedef  int  ( *pFUN)(unsigned char[], int, unsigned char[], int);
typedef  int  ( *pFUNEncryptData)(const char* , int , char* , int& );
typedef  int  ( *pFUNDecryptData)(const char* , int , char* , int& );
typedef  int  ( *pFUNApply)(const char* , int , char* , int& );
typedef  int  ( *pFUNApplyEx)(const char* , int , char* , int& );
typedef  int  ( *PFUNIdentifyCheck)(const char* , int , const char* , int );
typedef  int  ( *PFUNIdentifyCheckEx)(const char* , int , int , const char* , int );
typedef  int  ( *pFUNinit)();
typedef  int  ( *pFUNfini)();
//新增接口时候 step2 申明函数名字，
const char* funName_ExportAKSK = "Identify_ExportAKSK";
const char* funName_EncryptData = "Identify_EncryptData";
const char* funName_DecryptData = "Identify_DecryptData";
const char* funName_Apply = "Identify_Apply";
const char* funName_ApplyEx = "Identify_ApplyEx";
const char* funName_Check = "Identify_Check";
const char* funName_CheckEx = "Identify_CheckEx";
const char* funName2 = "Identify_Init";
const char* funName3 = "Identify_Fini";
//-------------------------以下是一些辅助函数--------------------------
static char base64[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
static int pos(char c){
	char *p;
	for (p = base64; *p; p++)
		if (*p == c)
			return p - base64;
	return -1;
}

int base64_encode(const void *data, int size, char **str){
	char *s, *p;
	int i;
	int c;
	const unsigned char *q;

	s = (char*)malloc(size * 4 / 3 + 4);
	p = s;
	if (p == NULL)
		return -1;
	q = (const unsigned char*)data;
	i = 0;
	for (i = 0; i < size;) {
		c = q[i++];
		c *= 256;
		if (i < size)
			c += q[i];
		i++;
		c *= 256;
		if (i < size)
			c += q[i];
		i++;
		p[0] = base64[(c & 0x00fc0000) >> 18];
		p[1] = base64[(c & 0x0003f000) >> 12];
		p[2] = base64[(c & 0x00000fc0) >> 6];
		p[3] = base64[(c & 0x0000003f) >> 0];
		if (i > size)
			p[3] = '=';
		if (i > size + 1)
			p[2] = '=';
		p += 4;
	}
	*p = 0;
	*str = s;
	//if (s == NULL)
	//    return -1;
	return strlen(s);
}

int base64_decode(const char *str, void *data){
	const char *p;
	unsigned char *q;
	int c;
	int x;
	int done = 0;
	q = (unsigned char*)data;
	for (p = str; *p && !done; p += 4) {
		x = pos(p[0]);
		if (x >= 0)
			c = x;
		else {
			done = 3;
			break;
		}
		c *= 64;

		x = pos(p[1]);
		if (x >= 0)
			c += x;
		else
			return -1;
		c *= 64;

		if (p[2] == '=')
			done++;
		else {
			x = pos(p[2]);
			if (x >= 0)
				c += x;
			else
				return -1;
		}
		c *= 64;

		if (p[3] == '=')
			done++;
		else {
			if (done)
				return -1;
			x = pos(p[3]);
			if (x >= 0)
				c += x;
			else
				return -1;
		}
		if (done < 3)
			*q++ = (c & 0x00ff0000) >> 16;

		if (done < 2)
			*q++ = (c & 0x0000ff00) >> 8;
		if (done < 1)
			*q++ = (c & 0x000000ff) >> 0;
	}
	return q - (unsigned char*)data;
}

void SplitString(const std::string& s, std::vector<std::string>& v, const std::string& c){
  std::string::size_type pos1, pos2;
  pos2 = s.find(c);
  pos1 = 0;
  while(std::string::npos != pos2)
  {
    v.push_back(s.substr(pos1, pos2-pos1));
 
    pos1 = pos2 + c.size();
    pos2 = s.find(c, pos1);
  }
  if(pos1 != s.length())
    v.push_back(s.substr(pos1));
}
//------------------------------------接口正文---------------------------
std::string genAK(std::string dllPath){
	
	void *handle =NULL;
	fstream fs("log.txt", ios::out | ios::trunc);

	char *error = NULL;

	//1找到这个dll
	stringstream ss;
	ss<<dllPath.c_str()<<"/lib/linux/x64/libIdentify.so";

	handle = dlopen(ss.str().c_str(), RTLD_NOW);     
	if (!handle)
	{
		fs << "not found so" << endl;
		return "";
	}
	pFUN pf = (pFUN)dlsym(handle, funName_ExportAKSK);   
	if ((error = dlerror()) != NULL)
	{
		fs << "not found function in this so"<< funName_ExportAKSK <<error<< endl;
		return "";
	}
	pFUNinit pf2 = (pFUNinit)dlsym(handle, funName2);   
	if ((error = dlerror()) != NULL)
	{
		fs << "not found function in this so" << funName_ExportAKSK << endl;
		return "";
	}
	pFUNfini pf3 = (pFUNfini)dlsym(handle, funName3);    
	if ((error = dlerror()) != NULL)
	{
		fs << "not found function in this so" << funName_ExportAKSK << endl;
		return "";
	}

	int ret= pf2();
	if (ret != 0)
	{
		fs << "Identify_Init fail" << endl;
		return "";
	}

	int akLen = 64;
	unsigned char szAK[64] = { 0 };
	int skLen = 64;
	unsigned char szSK[64] = { 0 };
	
	int len = pf(szAK, akLen, szSK, skLen);
	if (len != 0) {
		fs << "call Identify_ExportAKSK error,not fetch ak" << endl;
		return "";
	}


	unsigned char aK[17] = { 0 };
	for (int i = 0; i < 16; ++i) {
		aK[i] = szAK[i];
	}
	fs << "ak is :" << aK << endl;
	
	pf3();

	dlclose(handle);      
    return (char*)aK;;
}

std::string genSK(std::string dllPath){
	
	void *handle =NULL;
	fstream fs("log.txt", ios::out | ios::trunc);

	char *error = NULL;

	//1找到这个dll
	stringstream ss;
	ss<<dllPath.c_str()<<"/lib/linux/x64/libIdentify.so";

	handle = dlopen(ss.str().c_str(), RTLD_NOW);     
	if (!handle)
	{
		fs << "not found so" << endl;
		return "";
	}
	pFUN pf = (pFUN)dlsym(handle, funName_ExportAKSK);   
	if ((error = dlerror()) != NULL)
	{
		fs << "not found function in this so"<< funName_ExportAKSK <<error<< endl;
		return "";
	}
	pFUNinit pf2 = (pFUNinit)dlsym(handle, funName2);   
	if ((error = dlerror()) != NULL)
	{
		fs << "not found function in this so" << funName_ExportAKSK << endl;
		return "";
	}
	pFUNfini pf3 = (pFUNfini)dlsym(handle, funName3);    
	if ((error = dlerror()) != NULL)
	{
		fs << "not found function in this so" << funName_ExportAKSK << endl;
		return "";
	}

	int ret= pf2();
	if (ret != 0)
	{
		fs << "Identify_Init fail" << endl;
		return "";
	}

	int akLen = 64;
	unsigned char szAK[64] = { 0 };
	int skLen = 64;
	unsigned char szSK[64] = { 0 };
	
	int len = pf(szAK, akLen, szSK, skLen);
	if (len != 0) {
		fs << "call Identify_ExportAKSK error,not fetch sk" << endl;
		return "";
	}


	unsigned char sK[33] = { 0 };
	for (int i = 0; i < 32; ++i) {
		sK[i] = szSK[i];
	}
	fs << "sk is :" << sK << endl;
	
	pf3();

	dlclose(handle);      
    return (char*)sK;;
}

std::string encryptStr(std::string dllPath,std::string data){
	fstream fs("log.txt", ios::out | ios::trunc);
	void *handle =NULL;

	char *error = NULL;

	//1找到这个dll
	stringstream ss;
	ss<<dllPath.c_str()<<"/lib/linux/x64/libIdentify.so";

	handle = dlopen(ss.str().c_str(), RTLD_NOW);     //打开argv[1]指定的动态库
	if (!handle)
	{
		fs << "没有找到这个so" << endl;
		return "";
	}
	pFUNEncryptData pf = (pFUNEncryptData)dlsym(handle, funName_EncryptData);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数"<< funName_EncryptData <<error<< endl;
		return "";
	}
	pFUNinit pf2 = (pFUNinit)dlsym(handle, funName2);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数" << funName2 << endl;
		return "";
	}
	pFUNfini pf3 = (pFUNfini)dlsym(handle, funName3);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数" << funName3 << endl;
		return "";
	}
	int ret = pf2();
	if (ret != 0)
	{
		fs << "Identify_Init 初始化失败." << endl;
		return "";
	}
	//正文开始
	char EncryptData[1024 * 10] = { 0 };
	int EncryptDataLen = 1024 * 10;
	if (pf(data.c_str(), data.size(), EncryptData, EncryptDataLen) != 0)
	{
		fs << "调用Identify_EncryptData后没有正确返回,即获取不到正确的zhi." << endl;
		return "";
	}
	char* base64EncodeBuffer = NULL;
	int iRet = base64_encode(EncryptData, EncryptDataLen, &base64EncodeBuffer);
	if (iRet < 0)
	{
		fs << "调用base64_encode后,没有加密成功." << endl;
		return "";
	}
	
	fs << "after EncryptData is: " << base64EncodeBuffer << endl;


	//正文结束，善后释放工作
	pf3();
	dlclose(handle);      //关闭调用动态库句柄
	string result = base64EncodeBuffer;
	free(base64EncodeBuffer);
	return result;
}

std::string encryptMultiStr(std::string dllPath,std::string data){
	fstream fs("log.txt", ios::out | ios::trunc);
	void *handle =NULL;

	char *error = NULL;
	//1找到这个dll
	stringstream ss;
	ss<<dllPath.c_str()<<"/lib/linux/x64/libIdentify.so";
	handle = dlopen(ss.str().c_str(), RTLD_NOW);     //打开argv[1]指定的动态库

	if (!handle)
	{
		fs << "没有找到这个so" << endl;
		return "";
	}
	pFUNEncryptData pf = (pFUNEncryptData)dlsym(handle, funName_EncryptData);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数"<< funName_EncryptData <<error<< endl;
		return "";
	}
	pFUNinit pf2 = (pFUNinit)dlsym(handle, funName2);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数" << funName2 << endl;
		return "";
	}
	pFUNfini pf3 = (pFUNfini)dlsym(handle, funName3);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数" << funName3 << endl;
		return "";
	}
	int ret = pf2();
	if (ret != 0)
	{
		fs << "Identify_Init 初始化失败." << endl;
		return "";
	}
	vector<string> vtData;
	stringstream ssResult;
	//以,分割用error填充错误
	SplitString(data,vtData,",");
	for(int i=0;i<vtData.size();i++)
	{
	//正文开始
		char EncryptData[1024 * 10] = { 0 };
		int EncryptDataLen = 1024 * 10;
		if (pf(vtData[i].c_str(), vtData[i].size(), EncryptData, EncryptDataLen) != 0)
		{
			fs <<"第"<<i<<"次调用Identify_EncryptData后没有正确返回,即获取不到正确的zhi." << endl;
			ssResult<<"error,";
			continue;
		}
		char* base64EncodeBuffer = NULL;
		int iRet = base64_encode(EncryptData, EncryptDataLen, &base64EncodeBuffer);
		if (iRet < 0)
		{
			fs <<"第"<<i<<"次调用base64_encode后,没有加密成功." << endl;
			ssResult<<"error,";
			continue;
		}
		string tmp = base64EncodeBuffer;
		free(base64EncodeBuffer);
		ssResult<<tmp<<",";
		fs <<"第"<<i<<"次after EncryptData is: " << tmp.c_str() << endl;
	}
	string result=ssResult.str();
	if(result!="")
		result = result.substr(0, result.length() - 1); //消除最后一位逗号

	//正文结束，善后释放工作
	pf3();
	dlclose(handle);      //关闭调用动态库句柄
	
	return result;
}

std::string decryptStr(std::string dllPath,std::string data){
	fstream fs("log.txt", ios::out | ios::trunc);
	void *handle =NULL;

	char *error = NULL;

	//1找到这个dll
	stringstream ss;
	ss<<dllPath.c_str()<<"/lib/linux/x64/libIdentify.so";

	handle = dlopen(ss.str().c_str(), RTLD_NOW);     //打开argv[1]指定的动态库
	if (!handle)
	{
		fs << "没有找到这个so" << endl;
		return "";
	}
	pFUNDecryptData pf = (pFUNDecryptData)dlsym(handle, funName_DecryptData);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数"<< funName_DecryptData <<error<< endl;
		return "";
	}
	pFUNinit pf2 = (pFUNinit)dlsym(handle, funName2);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数" << funName2 << endl;
		return "";
	}
	pFUNfini pf3 = (pFUNfini)dlsym(handle, funName3);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数" << funName3 << endl;
		return "";
	}
	int ret = pf2();
	if (ret != 0)
	{
		fs << "Identify_Init 初始化失败." << endl;
		return "";
	}
	//正文开始
	char base64DecodeBuffer[1000] = { 0 };
	int iRet = base64_decode(data.c_str(), base64DecodeBuffer);
	if (iRet < 0)
	{
		fs << "调用base64_encode后,没有解密成功." << endl;
		return "";
	}
	
	
	char DecryptData[1024 * 10] = { 0 };
	int DecryptDataLen = 1024 * 10;
	if (pf(base64DecodeBuffer, iRet, DecryptData, DecryptDataLen) != 0)
	{
		fs << "Identify_DecryptData,即获取不到正确的zhi." << endl;
		return "";
	}
	string result(DecryptData, DecryptDataLen);
	fs << "after DecryptData is: " << result.c_str() << endl;


	//正文结束，善后释放工作
	pf3();
	dlclose(handle);      //关闭调用动态库句柄
	return result;
}

std::string decryptMultiStr(std::string dllPath,std::string data)
{
	fstream fs("log.txt", ios::out | ios::trunc);
	void *handle =NULL;

	char *error = NULL;
	//1找到这个dll
	stringstream ss;
	ss<<dllPath.c_str()<<"/lib/linux/x64/libIdentify.so";

	handle = dlopen(ss.str().c_str(), RTLD_NOW);     //打开argv[1]指定的动态库
	if (!handle)
	{
		fs << "没有找到这个so" << endl;
		return "";
	}
	pFUNDecryptData pf = (pFUNDecryptData)dlsym(handle, funName_DecryptData);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数"<< funName_DecryptData <<error<< endl;
		return "";
	}
	pFUNinit pf2 = (pFUNinit)dlsym(handle, funName2);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数" << funName2 << endl;
		return "";
	}
	pFUNfini pf3 = (pFUNfini)dlsym(handle, funName3);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数" << funName3 << endl;
		return "";
	}
	int ret = pf2();
	if (ret != 0)
	{
		fs << "Identify_Init 初始化失败." << endl;
		return "";
	}
	
	vector<string> vtData;
	stringstream ssResult;
	//以,分割用error填充错误
	SplitString(data,vtData,",");
	for(int i=0;i<vtData.size();i++)
	{
		//正文开始
		char base64DecodeBuffer[1000] = { 0 };
		int iRet = base64_decode(vtData[i].c_str(), base64DecodeBuffer);
		if (iRet < 0)
		{
			fs <<"第"<<i<<"次调用base64_decode后,没有解密成功." << endl;
			ssResult<<"error,";
			continue;
		}
		
		
		char DecryptData[1024 * 10] = { 0 };
		int DecryptDataLen = 1024 * 10;
		if (pf(base64DecodeBuffer, iRet, DecryptData, DecryptDataLen) != 0)
		{
			fs <<"第"<<i<<"次Identify_DecryptData,即获取不到正确的zhi." << endl;
			ssResult<<"error,";
			continue;
		}
		string tmp(DecryptData, DecryptDataLen);
		ssResult<<tmp<<",";
		fs <<"第"<<i<<"次after DecryptData is: " << tmp.c_str() << endl;
	}
	
	string result=ssResult.str();
	if(result!="")
		result = result.substr(0, result.length() - 1); //消除最后一位逗号

	//正文结束，善后释放工作
	pf3();
	dlclose(handle);      //关闭调用动态库句柄
	return result;
}

std::string genToken(std::string dllPath,std::string tokenStr){
	fstream fs("log.txt", ios::out | ios::trunc);
	void *handle =NULL;

	char *error = NULL;

	//1找到这个dll
	stringstream ss;
	ss<<dllPath.c_str()<<"/lib/linux/x64/libIdentify.so";

	handle = dlopen(ss.str().c_str(), RTLD_NOW);     //打开argv[1]指定的动态库
	if (!handle)
	{
		fs << "没有找到这个so" << endl;
		return "";
	}
	pFUNApply pf = (pFUNApply)dlsym(handle, funName_Apply);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数"<< funName_Apply <<error<< endl;
		return "";
	}
	pFUNinit pf2 = (pFUNinit)dlsym(handle, funName2);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数" << funName2 << endl;
		return "";
	}
	pFUNfini pf3 = (pFUNfini)dlsym(handle, funName3);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数" << funName3 << endl;
		return "";
	}
	int ret = pf2();
	if (ret != 0)
	{
		fs << "Identify_Init 初始化失败." << endl;
		return "";
	}
	//正文开始
	char szIdentifyData[1024 * 10] = { 0 };
	int nIdentifyDataLen = 1024 * 10;
	if(tokenStr != ""){
		if (pf(tokenStr.c_str(),strlen(tokenStr.c_str()), szIdentifyData, nIdentifyDataLen) != 0)
		{
			fs << "调用Identify_Apply后没有正确返回,即获取不到正确的token." << endl;
			return "";
		}
	}else{
		if (pf(NULL, 0, szIdentifyData, nIdentifyDataLen) != 0)
		{
			fs << "调用Identify_Apply后没有正确返回,即获取不到正确的token." << endl;
			return "";
		}
	}
	
	int iIdentifyencodeDataLen = 1024 * 10;
	char* base64EncodeBuffer = NULL;
	int iRet = base64_encode(szIdentifyData, nIdentifyDataLen, &base64EncodeBuffer);
	if (iRet < 0)
	{
		fs << "调用base64_encode后,没有加密成功." << endl;
		return "";
	}
	fs << "token is: " << base64EncodeBuffer << endl;


	//正文结束，善后释放工作
	pf3();
	dlclose(handle);      //关闭调用动态库句柄
	string result = base64EncodeBuffer;
	free(base64EncodeBuffer);
	return result;
}

std::string genTokenEx(std::string dllPath,std::string tokenStr){
	fstream fs("log.txt", ios::out | ios::trunc);
	void *handle =NULL;

	char *error = NULL;

	//1找到这个dll
	stringstream ss;
	ss<<dllPath.c_str()<<"/lib/linux/x64/libIdentify.so";

	handle = dlopen(ss.str().c_str(), RTLD_NOW);     //打开argv[1]指定的动态库
	if (!handle)
	{
		fs << "没有找到这个so" << endl;
		return "";
	}
	pFUNApplyEx pf = (pFUNApplyEx)dlsym(handle, funName_ApplyEx);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数"<< funName_ApplyEx <<error<< endl;
		return "";
	}
	pFUNinit pf2 = (pFUNinit)dlsym(handle, funName2);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数" << funName2 << endl;
		return "";
	}
	pFUNfini pf3 = (pFUNfini)dlsym(handle, funName3);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数" << funName3 << endl;
		return "";
	}
	int ret = pf2();
	if (ret != 0)
	{
		fs << "Identify_Init 初始化失败." << endl;
		return "";
	}
	//正文开始
	char szIdentifyData[1024 * 10] = { 0 };
	int nIdentifyDataLen = 1024 * 10;
	if(tokenStr != ""){
		if (pf(tokenStr.c_str(),strlen(tokenStr.c_str()), szIdentifyData, nIdentifyDataLen) != 0)
		{
			fs << "调用Identify_ApplyEx后没有正确返回,即获取不到正确的token." << endl;
			return "";
		}
	}else{
		if (pf(NULL, 0, szIdentifyData, nIdentifyDataLen) != 0)
		{
			fs << "调用Identify_ApplyEx后没有正确返回,即获取不到正确的token." << endl;
			return "";
		}
	}
	
	int iIdentifyencodeDataLen = 1024 * 10;
	char* base64EncodeBuffer = NULL;
	int iRet = base64_encode(szIdentifyData, nIdentifyDataLen, &base64EncodeBuffer);
	if (iRet < 0)
	{
		fs << "调用base64_encode后,没有加密成功." << endl;
		return "";
	}
	fs << "token is: " << base64EncodeBuffer << endl;


	//正文结束，善后释放工作
	pf3();
	dlclose(handle);      //关闭调用动态库句柄
	string result = base64EncodeBuffer;
	free(base64EncodeBuffer);
	return result;
}

int check(std::string dllPath,std::string data){
	fstream fs("log.txt", ios::out | ios::trunc);
	void *handle =NULL;

	char *error = NULL;

	//1找到这个dll
	stringstream ss;
	ss<<dllPath.c_str()<<"/lib/linux/x64/libIdentify.so";
	handle = dlopen(ss.str().c_str(), RTLD_NOW);     //打开argv[1]指定的动态库

	if (!handle)
	{
		fs << "没有找到这个so" << endl;
		return -1;
	}
	PFUNIdentifyCheck pf = (PFUNIdentifyCheck)dlsym(handle, funName_Check);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数"<< funName_Check <<error<< endl;
		return -1;
	}
	pFUNinit pf2 = (pFUNinit)dlsym(handle, funName2);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数" << funName2 << endl;
		return -1;
	}
	pFUNfini pf3 = (pFUNfini)dlsym(handle, funName3);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数" << funName3 << endl;
		return -1;
	}
	int ret = pf2();
	if (ret != 0)
	{
		fs << "Identify_Init 初始化失败." << endl;
		return -1;
	}
	//正文开始
	char output[200] = { 0 };

	int nRet = base64_decode(data.c_str(), output);
	if (nRet <= 0)
	{
		fs << "调用base64_decode解码失败." << endl;
		pf3();
		dlclose(handle); 
		return -1;
	}
	int iRet = pf(NULL, 0, output, nRet);
	if (iRet != 0)
	{
		fs << "调用Identify_Check后没有正确返回,即获取不到正确的zhi." << endl;
		pf3();
		dlclose(handle); 
		return iRet;
	}
	fs<<"校验token成功"<<endl;
	//正文结束，善后释放工作
	pf3();
	dlclose(handle);      //关闭调用动态库句柄
	
	return 0;
}

int checkEx(std::string dllPath,std::string data,int expireTime){
	fstream fs("log.txt", ios::out | ios::trunc);
	void *handle =NULL;

	char *error = NULL;

	//1找到这个dll
	stringstream ss;
	ss<<dllPath.c_str()<<"/lib/linux/x64/libIdentify.so";
	handle = dlopen(ss.str().c_str(), RTLD_NOW);     //打开argv[1]指定的动态库

	if (!handle)
	{
		fs << "没有找到这个so" << endl;
		return -1;
	}
	PFUNIdentifyCheckEx pf = (PFUNIdentifyCheckEx)dlsym(handle, funName_CheckEx);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数"<< funName_CheckEx <<error<< endl;
		return -1;
	}
	pFUNinit pf2 = (pFUNinit)dlsym(handle, funName2);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数" << funName2 << endl;
		return -1;
	}
	pFUNfini pf3 = (pFUNfini)dlsym(handle, funName3);    //指针pf指向test在当前内存中的地址
	if ((error = dlerror()) != NULL)
	{
		fs << "没有在这个so里面找到对应的函数" << funName3 << endl;
		return -1;
	}
	int ret = pf2();
	if (ret != 0)
	{
		fs << "Identify_Init 初始化失败." << endl;
		return -1;
	}
	//正文开始
	char output[200] = { 0 };

	int nRet = base64_decode(data.c_str(), output);
	if (nRet <= 0)
	{
		fs << "调用base64_decode解码失败." << endl;
		pf3();
		dlclose(handle); 
		return -1;
	}
	int iRet = pf(NULL, 0, expireTime, output, nRet);
	if (iRet != 0)
	{
		fs << "调用Identify_CheckEx后没有正确返回,即获取不到正确的zhi." << endl;
		pf3();
		dlclose(handle); 
		return iRet;
	}
	fs<<"校验token成功"<<endl;
	//正文结束，善后释放工作
	pf3();
	dlclose(handle);      //关闭调用动态库句柄
	
	return 0;
}
//------------------------------------N-API---------------------------
namespace identify {
	napi_value ExportAK (napi_env env, napi_callback_info info) {
		  napi_value result;
		  napi_status status;
		  napi_value argv[1]; 
		  size_t argc = sizeof(argv) / sizeof(napi_value);
		  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
		  char dllPath[2048] = "";
		  size_t data_size_n = 0;
		  if( napi_ok != napi_get_value_string_utf8(env, argv[0], dllPath, sizeof(dllPath)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  std::string ak = genAK(std::string(dllPath));
		  status = napi_create_string_utf8(env, (char*)ak.c_str(), NAPI_AUTO_LENGTH, &result);
		  if (status != napi_ok) return nullptr;
		  return result;
	}

	napi_value ExportSK (napi_env env, napi_callback_info info) {
		  napi_value result;
		  napi_status status;
		  napi_value argv[1]; 
		  size_t argc = sizeof(argv) / sizeof(napi_value);
		  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
		  char dllPath[2048] = "";
		  size_t data_size_n = 0;
		  if( napi_ok != napi_get_value_string_utf8(env, argv[0], dllPath, sizeof(dllPath)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  std::string sk = genSK(std::string(dllPath));
		  status = napi_create_string_utf8(env, (char*)sk.c_str(), NAPI_AUTO_LENGTH, &result);
		  if (status != napi_ok) return nullptr;
		  return result;
	}

	napi_value EncryptData (napi_env env, napi_callback_info info) {
		  napi_value result;
		  napi_status status;
		  napi_value argv[2]; 
		  size_t argc = sizeof(argv) / sizeof(napi_value);
		  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
		  char dllPath[2048] = "";
		  char data[2048] = "";
		  size_t data_size_n = 0;
		  if( napi_ok != napi_get_value_string_utf8(env, argv[0], dllPath, sizeof(dllPath)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  if( napi_ok != napi_get_value_string_utf8(env, argv[1], data, sizeof(data)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  std::string sk = encryptStr(std::string(dllPath),std::string(data));
		  status = napi_create_string_utf8(env, (char*)sk.c_str(), NAPI_AUTO_LENGTH, &result);
		  if (status != napi_ok) return nullptr;
		  return result;
	}

	napi_value EncryptMultiData (napi_env env, napi_callback_info info) {
		  napi_value result;
		  napi_status status;
		  napi_value argv[2]; 
		  size_t argc = sizeof(argv) / sizeof(napi_value);
		  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
		  char dllPath[2048] = "";
		//  char data[100000] = "";
		  char* data=new char[1000000];
		  memset(data,0,1000000);
		  size_t data_size_n = 0;
		  if( napi_ok != napi_get_value_string_utf8(env, argv[0], dllPath, sizeof(dllPath)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  if( napi_ok != napi_get_value_string_utf8(env, argv[1], data, 1000000, &data_size_n) ){
			 return nullptr;
		  }
		  std::string sk = encryptMultiStr(std::string(dllPath),std::string(data));
		  delete [] data;
		  status = napi_create_string_utf8(env, (char*)sk.c_str(), NAPI_AUTO_LENGTH, &result);
		  if (status != napi_ok) return nullptr;
		  return result;
	}

	napi_value DecryptData (napi_env env, napi_callback_info info) {
		  napi_value result;
		  napi_status status;
		  napi_value argv[2]; 
		  size_t argc = sizeof(argv) / sizeof(napi_value);
		  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
		  char dllPath[2048] = "";
		  char data[2048] = "";
		  size_t data_size_n = 0;
		  if( napi_ok != napi_get_value_string_utf8(env, argv[0], dllPath, sizeof(dllPath)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  if( napi_ok != napi_get_value_string_utf8(env, argv[1], data, sizeof(data)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  std::string sk = decryptStr(std::string(dllPath),std::string(data));
		  status = napi_create_string_utf8(env, (char*)sk.c_str(), NAPI_AUTO_LENGTH, &result);
		  if (status != napi_ok) return nullptr;
		  return result;
	}

	napi_value DecryptMultiData (napi_env env, napi_callback_info info) {
		  napi_value result;
		  napi_status status;
		  napi_value argv[2]; 
		  size_t argc = sizeof(argv) / sizeof(napi_value);
		  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
		  char dllPath[2048] = "";
		 // char data[100000] = "";
		  char* data=new char[1000000];
		  memset(data,0,1000000);
		  size_t data_size_n = 0;
		  if( napi_ok != napi_get_value_string_utf8(env, argv[0], dllPath, sizeof(dllPath)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  if( napi_ok != napi_get_value_string_utf8(env, argv[1], data, 1000000, &data_size_n) ){
			 return nullptr;
		  }
		  std::string sk = decryptMultiStr(std::string(dllPath),std::string(data));
		  delete [] data;
		  status = napi_create_string_utf8(env, (char*)sk.c_str(), NAPI_AUTO_LENGTH, &result);
		  if (status != napi_ok) return nullptr;
		  return result;
	}

	napi_value GeneralToken (napi_env env, napi_callback_info info) {
		  napi_value result;
		  napi_status status;
		  napi_value argv[2]; 
		  size_t argc = sizeof(argv) / sizeof(napi_value);
		  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
		  char dllPath[2048] = "";
		  char tokenStr[2048] = "";
		  size_t data_size_n = 0;
		  if( napi_ok != napi_get_value_string_utf8(env, argv[0], dllPath, sizeof(dllPath)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  if( napi_ok != napi_get_value_string_utf8(env, argv[1], tokenStr, sizeof(tokenStr)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  std::string sk = genToken(std::string(dllPath),std::string(tokenStr));
		  status = napi_create_string_utf8(env, (char*)sk.c_str(), NAPI_AUTO_LENGTH, &result);
		  if (status != napi_ok) return nullptr;
		  return result;
	}

	napi_value GeneralTokenEx (napi_env env, napi_callback_info info) {
		  napi_value result;
		  napi_status status;
		  napi_value argv[2]; 
		  size_t argc = sizeof(argv) / sizeof(napi_value);
		  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
		  char dllPath[2048] = "";
		  char tokenStr[2048] = "";
		  size_t data_size_n = 0;
		  if( napi_ok != napi_get_value_string_utf8(env, argv[0], dllPath, sizeof(dllPath)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  if( napi_ok != napi_get_value_string_utf8(env, argv[1], tokenStr, sizeof(tokenStr)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  std::string sk = genTokenEx(std::string(dllPath),std::string(tokenStr));
		  status = napi_create_string_utf8(env, (char*)sk.c_str(), NAPI_AUTO_LENGTH, &result);
		  if (status != napi_ok) return nullptr;
		  return result;
	}

	napi_value IdentifyCheck (napi_env env, napi_callback_info info) {
		  napi_value result;
		  napi_status status;
		  napi_value argv[2]; 
		  size_t argc = sizeof(argv) / sizeof(napi_value);
		  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
		  char dllPath[2048] = "";
		  char data[2048] = "";
		  size_t data_size_n = 0;
		  if( napi_ok != napi_get_value_string_utf8(env, argv[0], dllPath, sizeof(dllPath)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  if( napi_ok != napi_get_value_string_utf8(env, argv[1], data, sizeof(data)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  int rst = check(std::string(dllPath),std::string(data));
		  status = napi_create_int32(env, rst, &result);
		  if (status != napi_ok) return nullptr;
		  return result;
	}

	napi_value IdentifyCheckEx (napi_env env, napi_callback_info info) {
		  napi_value result;
		  napi_status status;
		  napi_value argv[3]; 
		  size_t argc = sizeof(argv) / sizeof(napi_value);
		  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
		  char dllPath[2048] = "";
		  char data[2048] = "";
		  int32_t expireTime = 60;
		  size_t data_size_n = 0;
		  if( napi_ok != napi_get_value_string_utf8(env, argv[0], dllPath, sizeof(dllPath)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  if( napi_ok != napi_get_value_string_utf8(env, argv[1], data, sizeof(data)/sizeof(char), &data_size_n) ){
			 return nullptr;
		  }
		  if( napi_ok != napi_get_value_int32(env, argv[2], &expireTime)){
			  return nullptr;
		  }
		  int rst = checkEx(std::string(dllPath),std::string(data),expireTime);
		  status = napi_create_int32(env, rst, &result);
		  if (status != napi_ok) return nullptr;
		  return result;
	}

	napi_value init(napi_env env, napi_value exports) {
		napi_property_descriptor properties[] = {
			{ "exportAK", 0, ExportAK, 0, 0, 0, napi_default, 0 },
			{ "exportSK", 0, ExportSK, 0, 0, 0, napi_default, 0 },
			{ "encryptData", 0, EncryptData, 0, 0, 0, napi_default, 0 },
			{ "encryptMultiData", 0, EncryptMultiData, 0, 0, 0, napi_default, 0 },  
			{ "decryptData", 0, DecryptData, 0, 0, 0, napi_default, 0 },
			{ "decryptMultiData", 0, DecryptMultiData, 0, 0, 0, napi_default, 0 },
			{ "apply", 0, GeneralToken, 0, 0, 0, napi_default, 0 },
			{ "applyEx", 0, GeneralTokenEx, 0, 0, 0, napi_default, 0 },
			{ "check", 0, IdentifyCheck, 0, 0, 0, napi_default, 0 },
			{ "checkEx", 0, IdentifyCheckEx, 0, 0, 0, napi_default, 0 }
		};
		napi_status status = napi_define_properties(env, exports, sizeof(properties)/sizeof(properties[0]), properties);
		if( napi_ok != status){
			napi_throw_error(env, "INITIALIZE_FAILED", "Failed to initialize");
			return nullptr;
		}
		return exports;
	}

	NAPI_MODULE(hikidentify, init); 
} 

